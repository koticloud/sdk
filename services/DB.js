import { v4 as uuidv4 } from 'uuid';
import IndexedDB from './DbDrivers/IndexedDB';

class DB
{
    constructor(name, driver = 'indexedDb') {
        // The database
        this._dbName = `koti_cloud_${name}`;
        this._driverName = driver;
        this._driver = null;
        this._initialized = false;

        // Query builder
        this._query = {};
        this._resetQuery();
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
     * Select a data collection to work on.
     * 
     * @param {string} name 
     */
    collection(name) {
        this._query.collection = name;

        return this;
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
        // TODO: to be implemented
        // const exists = this.orders.find(order => {
        //     return order[field];
        // });

        // if (exists) {
        //     exists[field] = dir;
        // } else {
        //     this.orders.push({ [field]: dir });
        // }

        // this.isQuery = true;

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
     * Reset the query (builder)
     */
    _resetQuery() {
        this._query = {
            collection: null,
            wheres: [
                // By default the deleted (trashed) items are hidden
                {
                    field: '_deleted_at',
                    operator: '=',
                    value: null,
                }
            ],
        };
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
            _created_at: new Date(),
            _updated_at: new Date(),
            _deleted_at: null,
        });

        // Call the driver method
        return await this._driver.create(data);
    }

    // /**
    //  * Create a new document if it doesn't exist. Return the document if it does
    //  * exist.
    //  * object is not unique.
    //  * 
    //  * @param {object} data 
    //  */
    // async firstOrCreate(data) {
    //     let doc;

    //     try {
    //         doc = await this._db.get(data._id);

    //         return doc;
    //     } catch (error) {
    //         // Document doesn't exist
    //     }

    //     // Create a document
    //     return this.create(data);
    // }

    // /**
    //  * Update an existing document.
    //  * 
    //  * @param {PouchDB doc} doc 
    //  */
    // async update(doc) {
    //     await this._db.put(doc);

    //     return this.get(doc._id);
    // }

    // /**
    //  * Update an existing document or create a new one if it doesn't exist.
    //  * 
    //  * @param {PouchDB doc}|obeject data 
    //  */
    // async updateOrCreate(data) {
    //     // The create method already works like update-or-create.
    //     return this.create(data);
    // }

    // /**
    //  * (soft) Delete a document.
    //  * 
    //  * @param {PouchDB document} doc 
    //  */
    // async remove(doc) {
    //     // The remove() methods removes all the fields from the document. If you
    //     // need those fields the official documentation recommends just setting
    //     // "_deleted = true" manually.
    //     // return this._db.remove(doc);

    //     doc._deleted = true;
    //     doc.deleted_at = new Date();

    //     return this._db.put(doc);
    // }

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
        const item = await this._driver.getById(id);

        if (!item) {
            throw {
                status: 404,
                reason: 'notfound',
            }
        }

        // Apply the trahsed/soft delete WHERE condition if any
        let condition = this._query.wheres.find(item => {
            return item.field === '_deleted_at';
        });

        if (condition) {
            const operator = condition.operator === '='
                ? '=='
                : condition.operator;

            condition = `${item[condition.field]} ${operator} ${condition.value}`;
            
            if (!eval(condition)) {
                if (operator == '!=' && condition.value == null) {
                    throw {
                        status: 404,
                        reason: 'deleted',
                    }
                }

                return null;
            }
        }
        
        return item;
    }

    // /**
    //  * Sync the DB with Koti Cloud server.
    //  */
    // async sync() {
    //     const hostParts = location.host.split('.');
    //     const host = `${location.protocol}//${hostParts[hostParts.length - 2]}.${hostParts[hostParts.length - 1]}`;

    //     const remoteDb = new DB(`${host}/api/i/app-user-db/sync/db/`);

    //     return this._db.sync(remoteDb._db, {
    //         // live: true,
    //         // retry: true
    //     });
    // }
}

export default DB;