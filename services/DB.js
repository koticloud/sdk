import { v4 as uuidv4 } from 'uuid';
import IndexedDB from './DbDrivers/IndexedDB';
import diff_match_patch from 'diff-match-patch';
import axios from 'axios';

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
            trash: 'trash',
            restore: 'restore',
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
            _purged: 0,
            _revs: [],
        });

        // Add a revision
        data._revs.push(this._makeRevision(this._revActions.create, {}, data));

        // Call the driver method
        return await this._driver.create(data);
    }

    /**
     * Store a new document as is. Throws an exception if the id inside the data
     * object is not unique.
     * 
     * @param {object} data 
     */
    async store(data) {
        // Make sure the driver is initialized
        await this._initDriver();

        // Call the driver method
        return await this._driver.create(data);
    }

    /**
     * Update an existing document.
     * 
     * @param {PouchDB doc} doc 
     */
    async update(doc, makeRevision = true) {
        // Make sure the driver is initialized
        await this._initDriver();

        // Original data before changes were made
        const before = await this.withTrashed().getById(doc._id);

        // Update the document's timestamps
        doc._updated_at = this._now();

        // Add a revision
        if (makeRevision) {
            doc._revs.push(this._makeRevision(this._revActions.edit, before, doc));
        }

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
     * Trash (soft-delete) a document.
     * 
     * @param {object} doc 
     */
    async trash(doc) {
        // Make sure the driver is initialized
        await this._initDriver();

        // Original data before changes were made
        const before = await this.getById(doc._id);

        // Update the document object
        doc._deleted_at = this._now();
        doc._updated_at = this._now();

        // Add a revision
        doc._revs.push(this._makeRevision(this._revActions.trash, before, doc));

        // Call the driver method
        return await this._driver.update(doc);
    }

    /**
     * Purge (hard-delete) a document.
     * 
     * @param {object} doc 
     */
    async delete(doc) {
        // Make sure the driver is initialized
        await this._initDriver();

        // Original data before changes were made
        const before = await this.withTrashed().getById(doc._id);

        // Update the document object
        doc._deleted_at = this._now();
        doc._updated_at = this._now();
        doc._purged = 1;

        // Add a revision
        doc._revs.push(this._makeRevision(this._revActions.delete, before, doc));

        // Call the driver method
        return await this._driver.update(doc);
    }

    /**
     * Restore a trashed (soft-deleted) document.
     * 
     * @param {object} doc 
     */
    async restore(doc) {
        // Make sure the driver is initialized
        await this._initDriver();

        // Original data before changes were made
        const before = await this.withTrashed().getById(doc._id);

        // Update the document object
        doc._deleted_at = null;
        doc._updated_at = this._now();

        // Add a revision
        doc._revs.push(this._makeRevision(this._revActions.restore, before, doc));

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
     * Get ALL existing docs, including the trashed and purged/deleted ones.
     */
    async getAll() {
        // Make sure the driver is initialized
        await this._initDriver();

        // Call the driver method
        const docs = await this._driver.getAll();

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
     * Delete a documents by id.
     * 
     * @param {string} id
     */
    async deleteById(id) {
        // Make sure the driver is initialized
        await this._initDriver();

        // Call the driver method
        await this._driver.deleteById(id);

        return true;
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
        
        // Figure our the list of common fields
        let fields = Object.assign({}, before, after);

        // Remove the special fields form the list
        delete fields._id;
        delete fields._collection;
        delete fields._revs;

        // Field names
        fields = Object.keys(fields);

        // Figure out the differences between the two documents
        let diff = {};

        // Figure our the difference for each field
        switch (action) {
            case this._revActions.trash:
                // We don't need any specific changes for trashed objects,
                // except for the _deleted_at timestamp
                diff = {
                    _deleted_at: [
                        [1, this._now()],
                    ],
                };

                break;
            case this._revActions.restore:
                // We don't need any specific changes for restored objects,
                // except for the nulled _deleted_at
                diff = {
                    _deleted_at: [
                        [-1, before._deleted_at],
                    ],
                };

                break;
            case this._revActions.delete:
                // We don't need any specific changes for deleted objects,
                // since all its revs and data will be deleted on the server
                diff = {};

                break;
            default:
                for (let field of fields) {
                    if (before[field] === undefined) {
                        diff[field] = [
                            // A single "Add chars" action
                            [1, after[field]]
                        ];
                    } else if (after[field] === undefined) {
                        diff[field] = [
                            // A single "Remove chars" action
                            [0, before[field]]
                        ];
                    } else {
                        const beforeVal = (typeof before[field] === 'string')
                            ? before[field]
                            : JSON.stringify(before[field]);

                        const afterVal = (typeof after[field] === 'string')
                            ? after[field]
                            : JSON.stringify(after[field]);

                        diff[field] = this._dmp.diff_main(
                            beforeVal,
                            afterVal
                        );
                    }
                }
        }

        return {
            id: this._generateUniqueId(),
            order: ordinalNumber,
            action: action,
            diff: diff,
        };
    }

    /**
     * Sync the DB with Koti Cloud server.
     */
    async sync() {
        // Get the list of all the local docs
        const allDocs = await this.getAll();

        const diffs = await this.syncGetDiffs(allDocs);

        // Upload changes to the server. Let exceptions through to prevent the
        // further download operation in case of an error.
        await this.syncUploadChanges(allDocs, diffs.upload);

        // Re-download the just uploaded docs, because patching is done on the
        // server and we can't predict the final results, especially since there
        // might be conflicts
        const redownload = {};

        for (let docId of Object.keys(diffs.upload)) {
            redownload[docId] = [];
        }

        await this.syncDownloadChanges(redownload);

        // Download the missing changes from the server if the upload was
        // successful
        await this.syncDownloadChanges(diffs.download);

        // Delete the docs that were purged/deleted from the server
        await this.syncDeletePurged(diffs.deleted);

        return true;
    }

    /**
     * Get differences between the local and the remote Koti Cloud DBs.
     */
    async syncGetDiffs(allDocs) {
        // NOTE: Ignoring the exceptions here
        const revs = [];

        for (let doc of allDocs.docs) {
            for (let rev of doc._revs) {
                revs.push({
                    doc_id: doc._id,
                    rev_id: rev.id,
                });
            }
        }

        const response = await axios.post('/api/i/app-user-db/sync/diff', {
            revs: revs,
        });

        return response.data;
    }

    /**
     * Get differences between the local and the remote Koti Cloud DBs.
     */
    async syncUploadChanges(allDocs, upload) {
        if (!Object.keys(upload).length) {
            return true;
        }

        // NOTE: Ignoring the exceptions here
        // Prepare the data
        const docs = {};

        for (let doc of allDocs.docs) {
            if (upload[doc._id] !== undefined) {
                docs[doc._id] = doc;

                docs[doc._id]._revs = docs[doc._id]._revs.filter(item => {
                    return upload[doc._id].indexOf(item.id) > -1;
                });

                // Stringify revs' diffs, otherwise certain chars and some
                // spaces get lost when the data is sent to the server
                docs[doc._id]._revs = docs[doc._id]._revs.map(item => {
                    item.diff = JSON.stringify(item.diff);

                    return item;
                });
            }
        }

        await axios.post('/api/i/app-user-db/sync/upload', {
            docs: docs,
        });

        return true;
    }
 
    /**
     * Get differences between the local and the remote Koti Cloud DBs.
     */
    async syncDownloadChanges(download) {
        if (!Object.keys(download).length) {
            return true;
        }

        const response = await axios.post('/api/i/app-user-db/sync/download', {
            docs: download,
        });

        const docs = response.data.docs;

        // Create/update local docs
        for (let docId of Object.keys(docs)) {
            const data = docs[docId];

            data._revs = data._revs.map(revItem => {
                revItem.diff = JSON.parse(revItem.diff);

                return revItem;
            });

            // Convert the special fields
            data._created_at = data._created_at ? data._created_at : null;
            data._updated_at = data._updated_at ? data._updated_at : null;
            data._deleted_at = data._deleted_at ? data._deleted_at : null;
            data._purged = (data._purged === 0 || data._purged === 1 || data._purged === '0' || data._purged === '1')
                ? data._purged
                : 0;

            try {
                // If the doc exists - update it
                let doc = await this.withTrashed().getById(docId);

                // Update the doc data
                const missingRevs = data._revs;
                delete data._revs;

                doc = Object.assign(doc, data);

                // Add the new revs
                for (let rev of missingRevs) {
                    doc._revs.push(rev);
                }

                // Persist the changes without creating new revisions in the
                // process
                this.update(doc, false);
            } catch (error) {
                // Otherwise store a new doc
                await this.store(data);
            }
        }

        return true;
    }

    /**
     * Delete the docs that were purged/deleted from the server
     */
    async syncDeletePurged(deleted) {
        if (!Object.keys(deleted).length) {
            return true;
        }

        for (let id of deleted) {
            await this.deleteById(id);
        }

        return true;
    }
}

export default DB;