import { v4 as uuidv4 } from 'uuid';
import sha256 from 'js-sha256';
// import diff_match_patch from 'diff-match-patch';

import IndexedDB from './db-drivers/IndexedDB';
import HasEvents from '../traits/HasEvents';
import Api from './Api';

class DB
{
    constructor(name, driver = 'indexedDb', collection = null, cache = {}) {
        // The database
        this._dbName = name;
        this._driverName = driver;
        this._driver = null;
        this._initialized = false;
        this._syncing = false;
        this._validating = false;

        // Query builder
        this._query = {
            collection: collection,
        };
        this._resetQuery();

        // Current query cache
        this._cache = cache ? cache : {};

        // NOTE: Temporarily disabled as not using diff/patch anymore
        // this._revActions = {
        //     create: 'create',
        //     edit: 'edit',
        //     trash: 'trash',
        //     restore: 'restore',
        //     delete: 'delete',
        // };

        // this._dmp = new diff_match_patch();
    }

    /**
     * Initialize the preferred database driver
     */
    async _initDriver() {
        return new Promise(async (resolve, reject) => {
            if (this._initialized) {
                resolve();

                return true;
            }

            switch (this._driver) {
                default:
                    this._driver = await new IndexedDB(this._dbName).init();
                    this._initialized = true;
                    this._initializing = false;

                    resolve();
            }
        });
    }

    async runMigrations(migrations) {
        for (let name in migrations) {
            // Check if the migraiton was run already
            const exists = await this.collection('_migrations')
                .where('name', name)
                .first();

            if (exists) {
                continue;
            }

            // Run the migration
            migrations[name](this);

            // Save migration name to the migrations collection
            this.collection('_migrations').create({ name });
        }
    }

    /**
     * Initialize a query on a DB collection.
     * 
     * @param {string} name 
     */
    collection(name) {
        // Return a new DB object so that all queries are totally isolated
        return new DB(this._dbName, this._driverName, name, this._cache);
    }

    /**
     * Generate a unique ID string
     * 
     * @return string
     */
    _generateUniqueId() {
        // It's hard to ensure a 100% unique string, but we can try at least
        // SHA256 of 3 random UUIDs + current timestamp
        return sha256(`${uuidv4()}-${uuidv4()}-${uuidv4()}-${Date.now()}`);
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
            this._query.wheres.push({ field, operator: '=', value: operator });
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
     * Add a field to group by to the query.
     * 
     * @param {string} field 
     */
    groupBy(field) {
        if (this._query.groupBys.indexOf(field) === -1) {
            this._query.groupBys.push(field);
        }

        return this;
    }

    /**
     * Limit the number of results.
     * 
     * @param {integer} limit 
     */
    limit(limit) {
        this._query.limit = limit;

        return this;
    }

    /**
     * Skip N first results, start from...
     * 
     * @param {integer} from 
     */
    from(from) {
        this._query.from = from;

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
     * Include trashed docs in the results.
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
     * Include deleted/purged docs in the results.
     */
    _withPurged() {
        // Find the _deleted_at WHERE if any and remove it
        const condition = this._query.wheres.find(item => {
            return item.field == '_purged';
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
                // By default the trashed items are hidden
                {
                    field: '_deleted_at',
                    operator: '=',
                    value: null,
                },
                // By default the deleted (purged) items are hidden
                {
                    field: '_purged',
                    operator: '=',
                    value: 0,
                },
            ],
            orders: [],
            groupBys: [],
            distinct: null,
        };
    }

    /**
     * Get the current timestamp.
     */
    _now() {
        return Math.round(Date.now() / 1000);
    }

    /**
     * Cache query results
     * 
     * @param {String} type 
     * @param {object} data 
     */
    _cacheResults(type, options) {
        if (!this._cache[type]) {
            this._cache[type] = {};
        }

        if (type === 'multiple' || type === 'first') {
            if (options.query.collection) {
                const key = sha256(JSON.stringify(options.query));
    
                this._cache[type][key] = Object.assign({}, options.data);
            }
        }
    }

    /**
     * Get cached query results
     * 
     * @param {String} type 
     * @param {object} options 
     */
    _getCached(type, options) {
        if (!this._cache[type]) {
            return null;
        }

        let key;

        if (type === 'multiple' || type === 'first') {
            if (options.query.collection) {
                key = sha256(JSON.stringify(options.query));
            }
        }

        return key && this._cache[type][key]
            ? Object.assign({}, this._cache[type][key])
            : null;
    }

    /**
     * Invalidate certain cache types
     * 
     * @param {Array} types 
     */
    _invalidateCacheTypes(types) {
        for (let type of types) {
            if (this._cache.hasOwnProperty(type)) {
                delete this._cache[type];
            }
        }
    }

    /**
     * Clear the whole cache
     */
    _clearCache() {
        this._cache = {};
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
            _synced: false,
            // _revs: [], // NOTE: Temporarily disabled as not using diff/patch anymore
        });

        this._invalidateCacheTypes(['multiple', 'first']);

        // NOTE: Temporarily disabled as not using diff/patch anymore
        // // Add a revision
        // data._revs.push(this._makeRevision(this._revActions.create, {}, data));

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

        this._invalidateCacheTypes(['multiple', 'first']);

        // Call the driver method
        return await this._driver.create(data);
    }

    /**
     * Update an existing document.
     * 
     * @param {object} doc 
     * @param {object} options
     */
    async update(doc, options = {}) {
        if (typeof doc !== 'object' || Array.isArray(doc)) {
            throw 'DB: invalid document object.';
        }

        // Make sure the driver is initialized
        await this._initDriver();

        // NOTE: Temporarily disabled as not using diff/patch anymore
        // // Original data before changes were made
        // const before = await this.withTrashed().getById(doc._id);

        // Update the document's metadata
        if (options.metadata !== false) {
            doc._synced = false;
        }

        // Update the document's timestamps
        if (options.timestamps !== false) {
            doc._updated_at = this._now();
        }

        this._invalidateCacheTypes(['multiple', 'first']);

        // NOTE: Temporarily disabled as not using diff/patch anymore
        // // Add a revision
        // if (makeRevision) {
        //     doc._revs.push(this._makeRevision(this._revActions.edit, before, doc));
        // }

        // Call the driver method
        return await this._driver.update(doc);
    }

    /**
     * Update an existing document or create a new one if it doesn't exist.
     * 
     * @param object data 
     * @param {object} options
     */
    async updateOrCreate(doc, options = {}) {
        if (typeof doc !== 'object' || Array.isArray(doc)) {
            throw 'DB: invalid document object.';
        }

        // Make sure the driver is initialized
        await this._initDriver();

        return (doc._id && doc._created_at)
            ? await this.update(doc, options)
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

        // NOTE: Temporarily disabled as not using diff/patch anymore
        // // Original data before changes were made
        // const before = await this.getById(doc._id);

        // Update the document object
        doc._deleted_at = this._now();
        doc._updated_at = this._now();
        doc._synced = false;

        this._invalidateCacheTypes(['multiple', 'first']);

        // NOTE: Temporarily disabled as not using diff/patch anymore
        // // Add a revision
        // doc._revs.push(this._makeRevision(this._revActions.trash, before, doc));

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

        // NOTE: Temporarily disabled as not using diff/patch anymore
        // // Original data before changes were made
        // const before = await this.withTrashed().getById(doc._id);

        // Update the document object
        doc._deleted_at = this._now();
        doc._updated_at = this._now();
        doc._purged = 1;
        doc._synced = false;

        this._invalidateCacheTypes(['multiple', 'first']);

        // NOTE: Temporarily disabled as not using diff/patch anymore
        // // Add a revision
        // doc._revs.push(this._makeRevision(this._revActions.delete, before, doc));

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

        // NOTE: Temporarily disabled as not using diff/patch anymore
        // // Original data before changes were made
        // const before = await this.withTrashed().getById(doc._id);

        // Update the document object
        doc._deleted_at = null;
        doc._updated_at = this._now();
        doc._synced = false;

        this._invalidateCacheTypes(['multiple', 'first']);

        // NOTE: Temporarily disabled as not using diff/patch anymore
        // // Add a revision
        // doc._revs.push(this._makeRevision(this._revActions.restore, before, doc));

        // Call the driver method
        return await this._driver.update(doc);
    }

    /**
     * Move a document to another collection.
     * 
     * @param {object} doc 
     * @param {string} collection 
     */
    async move(doc, collection) {
        // Make sure the driver is initialized
        await this._initDriver();

        if (doc._collection !== collection) {
            // Update the document object
            doc._collection = collection;

            // Call the driver method
            doc = await this._driver.update(doc);
        }

        this._invalidateCacheTypes(['multiple', 'first']);

        return doc;
    }

    /**
     * Return query results.
     */
    async get() {
        // Return cached results if any
        let results = this._getCached('multiple', {
            query: this._query
        });

        if (results !== null && typeof results === 'object') {
            return results;
        }

        // Make sure the driver is initialized
        await this._initDriver();

        // Call the driver method
        results = await this._driver.get(this._query);

        this._cacheResults('multiple', {
            query: this._query,
            data: results
        });

        // Reset the query
        this._resetQuery();

        return results;
    }

    /**
     * Return the first query result.
     */
    async first() {
        // Return cached results if any
        let results = this._getCached('first', {
            query: this._query
        });

        if (results) {
            return results;
        }

        // Make sure the driver is initialized
        await this._initDriver();

        // Call the driver method
        results = await this._driver.get(this._query);
        const doc = results.docs.length ? results.docs[0] : null;

        this._cacheResults('first', {
            query: this._query,
            data: doc
        });

        // Reset the query
        this._resetQuery();

        return doc;
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
            return null;
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
    async _deleteById(id) {
        // Make sure the driver is initialized
        await this._initDriver();

        // Call the driver method
        await this._driver.deleteById(id);

        this._invalidateCacheTypes(['multiple', 'first']);

        return true;
    }

    // /**
    //  * Make a revision for a document
    //  * 
    //  * @param {string} action 
    //  * @param {object} before 
    //  * @param {object} after 
    //  */
    // _makeRevision(action, before, after) {
    //     const ordinalNumber = before.hasOwnProperty('_revs')
    //         ? before._revs.length + 1
    //         : 1;
        
    //     // Figure our the list of common fields
    //     let fields = Object.assign({}, before, after);

    //     // Remove the special fields form the list
    //     delete fields._id;
    //     delete fields._collection;
    //     delete fields._revs;

    //     // Field names
    //     fields = Object.keys(fields);

    //     // Figure out the differences between the two documents
    //     let diff = {};

    //     // Figure our the difference for each field
    //     switch (action) {
    //         case this._revActions.trash:
    //             // We don't need any specific changes for trashed objects,
    //             // except for the _deleted_at timestamp
    //             diff = {
    //                 _deleted_at: [
    //                     [1, this._now()],
    //                 ],
    //             };

    //             break;
    //         case this._revActions.restore:
    //             // We don't need any specific changes for restored objects,
    //             // except for the nulled _deleted_at
    //             diff = {
    //                 _deleted_at: [
    //                     [-1, before._deleted_at],
    //                 ],
    //             };

    //             break;
    //         case this._revActions.delete:
    //             // We don't need any specific changes for deleted objects,
    //             // since all its revs and data will be deleted on the server
    //             diff = {};

    //             break;
    //         default:
    //             for (let field of fields) {
    //                 if (before[field] === undefined) {
    //                     diff[field] = [
    //                         // A single "Add chars" action
    //                         [1, after[field]]
    //                     ];
    //                 } else if (after[field] === undefined) {
    //                     diff[field] = [
    //                         // A single "Remove chars" action
    //                         [0, before[field]]
    //                     ];
    //                 } else {
    //                     const beforeVal = (typeof before[field] === 'string')
    //                         ? before[field]
    //                         : JSON.stringify(before[field]);

    //                     const afterVal = (typeof after[field] === 'string')
    //                         ? after[field]
    //                         : JSON.stringify(after[field]);

    //                     diff[field] = this._dmp.diff_main(
    //                         beforeVal,
    //                         afterVal
    //                     );
    //                 }
    //             }
    //     }

    //     return {
    //         id: this._generateUniqueId(),
    //         order: ordinalNumber,
    //         action: action,
    //         diff: diff,
    //     };
    // }

    /**
     * Validate the local DB by sending all the doc IDs to Koti Cloud server,
     * which will return a list of invalid docs which we can then wipe out.
     */
    async validate() {
        try {
            // Make sure the driver is initialized
            await this._initDriver();

            // Don't validate when offline
            if (!this.isOnline()) {
                return;
            }

            if (this._validating) {
                return;
            }

            this._validating = true;

            // Get IDs of all the docs
            const allDocs = await this.withTrashed()
                ._withPurged()
                .get();

            if (!allDocs.docs.length) {
                return true;
            }

            this.emit('syncing');

            const docIds = allDocs.docs.map(item => item._id);

            // Upload the data
            const response = await Api.validateDocs(docIds);

            // Server returns a list of invalid docs that we should delete
            await this._syncWipeInvalidDocs(response.data.invalid);

            this._validating = false;

            // this._clearCache();
            // this._driver.clearCache();

            this.emit('synced');

            return true;
        } catch (error) {
            // NOTE: Seems like the event is sent too soon and is not being
            // caught in the apps without a timeout (at the "sync on app start")
            setTimeout(() => {
                this.emit('sync-failed', error);
            });

            throw error;
        }
    }

    /**
     * Sync the DB with Koti Cloud server.
     * 
     * @param {bool} fireEvents
     */
    async sync(fireEvents = true) {
        try {
            // Make sure the driver is initialized
            await this._initDriver();

            // Don't try to sync when offline
            if (!this.isOnline()) {
                return;
            }

            if (this._syncing) {
                return;
            }

            if (fireEvents) {
                this.emit('syncing');
            }

            this._syncing = true;

            // Get the latest '_updated_at' timestamp among all the synced docs
            const allSyncedDocs = await this.withTrashed()
                ._withPurged()
                .where('_synced', true)
                .orderBy('_updated_at', 'desc')
                .get();

            let lastSyncAt = 0;

            if (allSyncedDocs.docs.length) {
                lastSyncAt = allSyncedDocs.docs[0]._updated_at;
            }

            // Prepare the list of docs to upload
            let docsToUpload = await this.withTrashed()
                ._withPurged()
                .where('_synced', false)
                .get();

            docsToUpload = docsToUpload.docs;

            // Upload the data
            const response = await Api.syncLww(lastSyncAt, docsToUpload);

            // Update local docs on success
            for (let doc of docsToUpload) {
                // Delete the purged docs forever
                if (doc._purged) {
                    await this._deleteById(doc._id);

                    continue;
                }

                // Mark the uploaded docs as synced
                doc._synced = true;

                this.update(doc, {
                    metadata: false,
                    timestamps: false,
                });
            }

            // Server returns a list of invalid docs that we should delete
            await this._syncWipeInvalidDocs(response.data.invalid);

            // Server returns data that we're missing locally. Save that data.
            await this._syncDownloadedChanges(response.data.downloads);

            // // Delete the docs that were purged/deleted from the server
            // await this.syncDeletePurged(diffs.deleted);

            this._syncing = false;

            if (fireEvents) {
                // this._clearCache();
                // this._driver.clearCache();

                this.emit('synced');
            }

            return true;
        } catch (error) {
            // NOTE: Seems like the event is sent too soon and is not being
            // caught in the apps without a timeout (at the "sync on app start")
            if (fireEvents) {
                setTimeout(() => {
                    this.emit('sync-failed', error);
                });
            }

            throw error;
        }
    }

    /**
     * Sync - apply changes from the server.
     */
    async _syncDownloadedChanges(data) {
        // Make sure the driver is initialized
        await this._initDriver();

        if (!data || !data.length) {
            return;
        }

        // Create/update local docs
        for (let doc of data) {
            let docData = JSON.parse(doc.document);

            // Delete forever the deleted/purged docs
            if (docData._purged) {
                await this._deleteById(doc.doc_id);

                continue;
            }

            // Mark the doc as synced, override the server value as it is
            // irrelevant
            docData._synced = true;

            // If the doc exists - update it
            let localDoc = await this.withTrashed()
                ._withPurged()
                .getById(doc.doc_id);

            if (localDoc) {
                // Update the doc
                this.update(docData, {
                    metadata: false,
                    timestamps: false,
                });
            } else {
                // Otherwise store a new doc
                await this.store(docData);
            }
        }

        return true;
    }

    /**
     * Sync - wipe out the invalid local docs.
     */
    async _syncWipeInvalidDocs(docIds) {
        // Make sure the driver is initialized
        await this._initDriver();

        if (!docIds || !docIds.length) {
            return;
        }

        // Create/update local docs
        for (let id of docIds) {
            await this._deleteById(id);
        }

        return true;
    }

    // NOTE: The original diff/patch sync code, diff/patch is temporarily
    // disabled
    // /**
    //  * Sync the DB with Koti Cloud server.
    //  */
    // async sync() {
    //     // Get the list of all the local docs
    //     const allDocs = await this.getAll();

    //     const diffs = await this.syncGetDiffs(allDocs);

    //     // Upload changes to the server. Let exceptions through to prevent the
    //     // further download operation in case of an error.
    //     await this.syncUploadChanges(allDocs, diffs.upload);

    //     // Re-download the just uploaded docs, because patching is done on the
    //     // server and we can't predict the final results, especially since there
    //     // might be conflicts
    //     const redownload = {};

    //     for (let docId of Object.keys(diffs.upload)) {
    //         redownload[docId] = [];
    //     }

    //     await this.syncDownloadChanges(redownload);

    //     // Download the missing changes from the server if the upload was
    //     // successful
    //     await this.syncDownloadChanges(diffs.download);

    //     // Delete the docs that were purged/deleted from the server
    //     await this.syncDeletePurged(diffs.deleted);

    //     return true;
    // }

    // /**
    //  * Get differences between the local and the remote Koti Cloud DBs.
    //  */
    // async syncGetDiffs(allDocs) {
    //     // NOTE: Ignoring the exceptions here
    //     const revs = [];

    //     for (let doc of allDocs.docs) {
    //         for (let rev of doc._revs) {
    //             revs.push({
    //                 doc_id: doc._id,
    //                 rev_id: rev.id,
    //             });
    //         }
    //     }

    //     const response = await Api.post('/api/apps/db/sync/diff', {
    //         revs: revs,
    //     });

    //     return response.data;
    // }

    // /**
    //  * Get differences between the local and the remote Koti Cloud DBs.
    //  */
    // async syncUploadChanges(allDocs, upload) {
    //     if (!Object.keys(upload).length) {
    //         return true;
    //     }

    //     // NOTE: Ignoring the exceptions here
    //     // Prepare the data
    //     const docs = {};

    //     for (let doc of allDocs.docs) {
    //         if (upload[doc._id] !== undefined) {
    //             docs[doc._id] = doc;

    //             docs[doc._id]._revs = docs[doc._id]._revs.filter(item => {
    //                 return upload[doc._id].indexOf(item.id) > -1;
    //             });

    //             // Stringify revs' diffs, otherwise certain chars and some
    //             // spaces get lost when the data is sent to the server
    //             docs[doc._id]._revs = docs[doc._id]._revs.map(item => {
    //                 item.diff = JSON.stringify(item.diff);

    //                 return item;
    //             });
    //         }
    //     }

    //     await Api.post('/api/apps/db/sync/upload', {
    //         docs: docs,
    //     });

    //     return true;
    // }
 
    // /**
    //  * Get differences between the local and the remote Koti Cloud DBs.
    //  */
    // async syncDownloadChanges(download) {
    //     if (!Object.keys(download).length) {
    //         return true;
    //     }

    //     const response = await Api.post('/api/apps/db/sync/download', {
    //         docs: download,
    //     });

    //     const docs = response.data.docs;

    //     // Create/update local docs
    //     for (let docId of Object.keys(docs)) {
    //         const data = docs[docId];

    //         data._revs = data._revs.map(revItem => {
    //             revItem.diff = JSON.parse(revItem.diff);

    //             return revItem;
    //         });

    //         // Convert the special fields
    //         data._created_at = data._created_at ? data._created_at : null;
    //         data._updated_at = data._updated_at ? data._updated_at : null;
    //         data._deleted_at = data._deleted_at ? data._deleted_at : null;
    //         data._purged = (data._purged === 0 || data._purged === 1 || data._purged === '0' || data._purged === '1')
    //             ? data._purged
    //             : 0;

    //         try {
    //             // If the doc exists - update it
    //             let doc = await this.withTrashed().getById(docId);

    //             // Update the doc data
    //             const missingRevs = data._revs;
    //             delete data._revs;

    //             doc = Object.assign(doc, data);

    //             // Add the new revs
    //             for (let rev of missingRevs) {
    //                 doc._revs.push(rev);
    //             }

    //             // Persist the changes without creating new revisions in the
    //             // process
    //             this.update(doc, false);
    //         } catch (error) {
    //             // Otherwise store a new doc
    //             await this.store(data);
    //         }
    //     }

    //     return true;
    // }

    // /**
    //  * Delete the docs that were purged/deleted from the server
    //  */
    // async syncDeletePurged(deleted) {
    //     if (!Object.keys(deleted).length) {
    //         return true;
    //     }

    //     for (let id of deleted) {
    //         await this._deleteById(id);
    //     }

    //     return true;
    // }

    /**
     * Wipe out the whole DB
     */
    async wipe() {
        await this._driver.wipeDb();

        // this._clearCache();
        // this._driver.clearCache();

        this.emit('synced');

        return true;
    }

    /**
     * Get the list of all the existing collections.
     * 
     * @return {Array}
     */
    async getCollections() {
        // Make sure the driver is initialized
        await this._initDriver();

        return await this._driver.getCollections();
    }

    /**
     * Check whether the app is online (whether there's Internet connection)
     * 
     * @return boolean
     */
    isOnline() {
        return window.navigator.onLine;
    }
}

/**
 * Traits
 */
Object.assign(DB.prototype, HasEvents);

export default DB;