import { v4 as uuidv4 } from 'uuid';
import IndexedDB from './DbDrivers/IndexedDB';
import diff_match_patch from 'diff-match-patch';

class DB
{
    constructor(name, driver = 'indexedDb', collection = null) {
        // The database
        this._dbName = `koti_cloud_${name}`;
        this._driverName = driver;
        this._driver = null;
        this._initialized = false;

        // Query builder
        this._query = {
            collection: collection,
        };
        this._resetQuery();

        this._revActions = {
            create: 'create',
            edit: 'edit',
            delete: 'delete',
        };

        this._dmp = new diff_match_patch();
    }

    /**
     * Initializ the preffered database driver
     */
    async _initDriver() {
        if (this._initialized) {
            return true;
        }

        switch (this._driver) {
            default:
                this._driver = await new IndexedDB(this._dbName);
                this._initialized = true;
        }
    }

    /**
     * Initialize a query on a DB collection.
     * 
     * @param {string} name 
     */
    collection(name) {
        const dbName = this._dbName.replace('koti_cloud_', '');
        
        // Return a new DB object so that all queries are totally isolated
        return new DB(dbName, this._driverName , name);
    }

    /**
     * Generate a unique ID string
     */
    _generateUniqueId() {
        return uuidv4();
    }

    /**
     * Add a 'where' constraint on the query.
     * 
     * @param {string} field 
     * @param {string} operator 
     * @param {mixed} value 
     */
    where(field, operator, value) {
        if (value !== undefined) {
            this._query.wheres.push({ field, operator, value });
        } else {
            this._query.wheres.push({ field, operator: '=', value });
        }

        return this;
    }

    /**
     * Add an order/sort rule to the query.
     * 
     * @param {string} field 
     * @param {string} dir 
     */
    orderBy(field, dir = 'asc') {
        const exists = this._query.orders.find(order => {
            return order[field];
        });

        if (exists) {
            exists[field] = dir;
        } else {
            this._query.orders.push({ [field]: dir });
        }

        return this;
    }

    /**
     * Fetch only trashed docs.
     */
    onlyTrashed() {
        const condition = this._query.wheres.find(item => {
            return item.field == '_deleted_at';
        });

        if (condition) {
            condition.operator = '!=';
            condition.value = null;

            return this;
        }

        return this.where('_deleted_at', '!=', null);
    }

    /**
     * Fetch both trashed and non-trashed docs.
     */
    withTrashed() {
        // Find the _deleted_at WHERE if any and remove it
        const condition = this._query.wheres.find(item => {
            return item.field == '_deleted_at';
        });
        
        if (!condition) {
            return this;
        }

        this._query.wheres.splice(this._query.wheres.indexOf(condition), 1);

        return this;
    }

    /**
     * Reset the query (builder)
     */
    _resetQuery() {
        this._query = {
            collection: this._query.collection,
            wheres: [
                // By default the deleted (trashed) items are hidden
                {
                    field: '_deleted_at',
                    operator: '=',
                    value: null,
                }
            ],
            orders: [],
        };
    }

    /**
     * Get the current timestamp.
     */
    _now() {
        return Math.floor((new Date()).getTime() / 1000);
    }

    /**
     * Create a new document. Throws an exception if the id inside the data
     * object is not unique.
     * 
     * @param {object} data 
     */
    async create(data) {
        // Make sure the driver is initialized
        await this._initDriver();

        // Append meta data
        data = Object.assign(data, {
            _collection: this._query.collection,
            _id: this._generateUniqueId(),
            _created_at: this._now(),
            _updated_at: this._now(),
            _deleted_at: null,
            _revs: [],
        });

        // Add a revision
        data._revs.push(this._makeRevision(this._revActions.create, {}, data));

        // Call the driver method
        return await this._driver.create(data);
    }

    /**
     * Update an existing document.
     * 
     * @param {PouchDB doc} doc 
     */
    async update(doc) {
        // Make sure the driver is initialized
        await this._initDriver();

        // Original data before changes were made
        const before = await this.getById(doc._id);

        // Update the document's timestamps
        doc._updated_at = this._now();

        // Add a revision
        doc._revs.push(this._makeRevision(this._revActions.edit, before, doc));

        // Call the driver method
        return await this._driver.update(doc);
    }

    /**
     * Update an existing document or create a new one if it doesn't exist.
     * 
     * @param {PouchDB doc}|obeject data 
     */
    async updateOrCreate(doc) {
        // Make sure the driver is initialized
        await this._initDriver();

        return (doc._id && doc._created_at)
            ? await this.update(doc)
            : await this.create(doc);
    }

    /**
     * (soft) delete a document.
     * 
     * @param {object} doc 
     */
    async delete(doc) {
        // Make sure the driver is initialized
        await this._initDriver();

        // Original data before changes were made
        const before = await this.getById(doc._id);

        // Update the document object
        doc._deleted_at = this._now();
        doc._updated_at = this._now();

        // Add a revision
        doc._revs.push(this._makeRevision(this._revActions.delete, before, doc));

        // Call the driver method
        return await this._driver.update(doc);
    }

    /**
     * Return query results.
     */
    async get() {
        // Make sure the driver is initialized
        await this._initDriver();

        // Call the driver method
        const docs = await this._driver.get(this._query);

        // Reset the query
        this._resetQuery();

        return {
            docs: docs,
            total: docs.length,
        };
    }

    /**
     * Get a document by id.
     * 
     * @param {string} id 
     */
    async getById(id) {
        // Make sure the driver is initialized
        await this._initDriver();

        // Call the driver method
        const doc = await this._driver.getById(id, this._query);

        if (!doc) {
            throw {
                status: 404,
                message: 'not found',
            }
        }

        // Reset the query
        this._resetQuery();
        
        return doc;
    }

    /**
     * Make a revision for a document
     * 
     * @param {string} action 
     * @param {object} before 
     * @param {object} after 
     */
    _makeRevision(action, before, after) {
        const ordinalNumber = before.hasOwnProperty('_revs')
            ? before._revs.length + 1
            : 1;
        
        // Make clones of the objects
        before = Object.assign({}, before);
        after = Object.assign({}, after);
        
        // Remove rev history from the data
        delete before._revs;
        delete after._revs;

        // Figure out the differences between the two documents
        let diff = '';

        switch (action) {
            case this._revActions.create:
                diff = [
                    // "Add chars" action
                    [1, JSON.stringify(after)]
                ];

                break;
            case this._revActions.delete:
                // We don't need any specific changes for deleted objects
                diff = [];

                break;
            default:
                diff = this._dmp.diff_main(
                    JSON.stringify(before),
                    JSON.stringify(after)
                );
        }

        return {
            id: this._generateUniqueId(),
            order: ordinalNumber,
            action: action,
            synced: false,
            diff: diff,
        };
    }

    /**
     * Sync the DB with Koti Cloud server.
     */
    async sync() {
        // TODO: To be implemented
        return true;
        // const hostParts = location.host.split('.');
        // const host = `${location.protocol}//${hostParts[hostParts.length - 2]}.${hostParts[hostParts.length - 1]}`;

        // const remoteDb = new DB(`${host}/api/i/app-user-db/sync/db/`);

        // return this._db.sync(remoteDb._db, {
        //     // live: true,
        //     // retry: true
        // });
    }
}

export default DB;