import { v4 as uuidv4 } from 'uuid';
import sha256 from 'js-sha256';
// import diff_match_patch from 'diff-match-patch';

import Dexie from './db-drivers/Dexie';
// import IndexedDB from './db-drivers/IndexedDB';
import HasEvents from '../traits/HasEvents';
import Api from './Api';

class DB
{
    constructor(name, migrations = {}, driver = 'indexedDb') {
        // The database
        this._dbName = name;
        this._driverName = driver;
        this._driver = null;
        this._initialized = false;
        this._syncing = false;
        this._validating = false;
        
        this._idField = '_id';
        this._metaFields = [
            '_collection',
            '_created_at',
            '_updated_at',
            '_deleted_at',
            '_purged',
            '_synced',
        ];

        this._migrations = this._prepareMigrations(migrations);

        // // Query builder
        // this._query = {};
        // this._resetQuery();

        // TODO: Temporarily disabled as not using diff/patch anymore
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
     * Prepare the migrations - add the ID and required meta fields.
     * 
     * @param {object} migrations 
     * @return {object} migrations 
     */
    _prepareMigrations(migrations) {
        // Apply the DB migrations, one version at a time
        for (let version in migrations) {
            // Format schema in the Dexie format
            const schema = migrations[version].schema;

            for (let tableName in schema) {
                // The first field is the primary key. Mark it as a unique index
                // with '&' at the beginning of the name. Apply Koti Cloud meta
                // fields at the end.
                schema[tableName] = [`&${this._idField}`]
                    .concat(schema[tableName])
                    .concat(this._metaFields);
            }
        }

        return migrations;
    }

    /**
     * Initialize everything required to work with the DB.
     */
    async init() {
        await this._initDriver();

        // Attach global hooks to the driver
        this._driver.hook('creating', (collection, primKey, doc) => {
            // Set all the Koti Cloud meta fields when creating a doc
            doc = Object.assign(doc, {
                _collection: collection,
                _id: this._generateUniqueId(),
                _created_at: this._now(),
                _updated_at: this._now(),
                _deleted_at: null,
                _purged: 0,
                _synced: false,
            });
        });

        this._driver.hook('updating', (collection, primKey, doc) => {
            // Set the update-related Koti Cloud meta fields when updating a doc
            doc = Object.assign(doc, {
                _updated_at: this._now(),
                _synced: false,
            });
        });

        // TODO: Add a withoutHooks() method to this.colleciton() to optionally ignore these hooks (e.g. while syncing to insert docs as is)

        return true;
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

            // Initialize a specific driver
            switch (this._driver) {
                default:
                    // NOTE: Abandoned the custom IndexedDB implementation for
                    // Dexie.js
                    // this._driver = await new IndexedDB(this._dbName).init();

                    this._driver = await new Dexie(this._dbName)
                        .init(this._migrations);

                    this._initialized = true;
                    this._initializing = false;
            }

            resolve();
        });
    }

    /**
     * Get a list of DB collection (table) names.
     * 
     * @return {array}
     */
    async collections() {
        await this._initDriver();

        return this._driver.collections();
    }

    /**
     * Initialize a query on a DB collection (return the driver instance
     * pointing to a collection)
     * 
     * @param {string} name
     * @return {object} driver
     */
    collection(name) {
        // const dbName = this._dbName.replace('koti_cloud_', '');
        
        // // Return a new DB object so that all queries are totally isolated
        // return new DB(dbName, this._migrations, this._driverName , name);
        return this._driver.collection(name);
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

    // /**
    //  * Add a 'where' constraint on the query.
    //  * 
    //  * @param {string} field 
    //  * @param {string} operator 
    //  * @param {mixed} value 
    //  */
    // where(field, operator, value) {
    //     if (value !== undefined) {
    //         this._query.wheres.push({ field, operator, value });
    //     } else {
    //         this._query.wheres.push({ field, operator: '=', value: operator });
    //     }

    //     return this;
    // }

    // /**
    //  * Add a 'limit' constraint on the query.
    //  * 
    //  * @param {integer} limit 
    //  */
    // limit(limit) {
    //     this._query.limit = limit;

    //     return this;
    // }

    // /**
    //  * Add an order/sort rule to the query.
    //  * 
    //  * @param {string} field 
    //  * @param {string} dir 
    //  */
    // orderBy(field, dir = 'asc') {
    //     const exists = this._query.orders.find(order => {
    //         return order[field];
    //     });

    //     if (exists) {
    //         exists[field] = dir;
    //     } else {
    //         this._query.orders.push({ [field]: dir });
    //     }

    //     return this;
    // }

    // /**
    //  * Fetch only trashed docs.
    //  */
    // onlyTrashed() {
    //     const condition = this._query.wheres.find(item => {
    //         return item.field == '_deleted_at';
    //     });

    //     if (condition) {
    //         condition.operator = '!=';
    //         condition.value = null;

    //         return this;
    //     }

    //     return this.where('_deleted_at', '!=', null);
    // }

    // /**
    //  * Include trashed docs in the results.
    //  */
    // withTrashed() {
    //     // Find the _deleted_at WHERE if any and remove it
    //     const condition = this._query.wheres.find(item => {
    //         return item.field == '_deleted_at';
    //     });
        
    //     if (!condition) {
    //         return this;
    //     }

    //     this._query.wheres.splice(this._query.wheres.indexOf(condition), 1);

    //     return this;
    // }

    // /**
    //  * Include deleted/purged docs in the results.
    //  */
    // _withPurged() {
    //     // Find the _deleted_at WHERE if any and remove it
    //     const condition = this._query.wheres.find(item => {
    //         return item.field == '_purged';
    //     });
        
    //     if (!condition) {
    //         return this;
    //     }

    //     this._query.wheres.splice(this._query.wheres.indexOf(condition), 1);

    //     return this;
    // }

    /**
     * Get the current timestamp.
     */
    _now() {
        return Date.now() / 1000;
    }

    // /**
    //  * Delete a documents by id.
    //  * 
    //  * @param {string} id
    //  */
    // async _deleteById(id) {
    //     // Call the driver method
    //     await this._driver.deleteById(id);

    //     return true;
    // }

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
        // TODO: Implement
        // // TODO: move to driver, call this._driver.validate() ?? Or nah, no need actually

        // // Don't validate when offline
        // if (!this._isOnline()) {
        //     return;
        // }

        // if (this._validating) {
        //     return;
        // }

        // this._validating = true;

        
        // // Get IDs of all the docs from all the tables
        // const allDocs = [];

        // for (let name of await this.collections()) {
        //     const docs = await this.collection(name).toArray();

        //     // TODO: withTrashed and other methods
        //     // const docs = await this.collection(name).toArray();
        //     // const docs = await this._driver._db[name].toArray();
        //     // const docs = await this.withTrashed()
        //     //     ._withPurged()
        //     //     .get();
        //     console.log(docs);
        // }
        // // TODO: Refactor to work with Dexie driver
        // // console.log(await this.collection('history'));

        // // for (let table of this._driver.tables) {
        // //     console.log(table);
        // // }
        // // const allDocs = await this.withTrashed()
        // //     ._withPurged()
        // //     .get();

        // // if (!allDocs.docs.length) {
        // //     return true;
        // // }

        // // const docIds = allDocs.docs.map(item => item._id);

        // // // Upload the data
        // // const response = await Api.validateDocs(docIds);

        // // // Server returns a list of invalid docs that we should delete
        // // await this._syncWipeInvalidDocs(response.data.invalid);

        // // this._validating = false;

        // // this.emit('synced');

        // // return true;
    }

    /**
     * Sync the DB with Koti Cloud server.
     */
    async sync() {
        // TODO: Refactor to work with Dexie
        // // Don't try to sync when offline
        // if (!this._isOnline()) {
        //     return;
        // }

        // if (this._syncing) {
        //     return;
        // }

        // this._syncing = true;

        // // Get the latest '_updated_at' timestamp among all the synced docs
        // const allSyncedDocs = await this.withTrashed()
        //     ._withPurged()
        //     .where('_synced', true)
        //     .orderBy('_updated_at', 'desc')
        //     .get();

        // let lastSyncAt = 0;

        // if (allSyncedDocs.docs.length) {
        //     lastSyncAt = allSyncedDocs.docs[0]._updated_at;
        // }

        // // Prepare the list of docs to upload
        // let docsToUpload = await this.withTrashed()
        //     ._withPurged()
        //     .where('_synced', false)
        //     .get();

        // docsToUpload = docsToUpload.docs;

        // // Upload the data
        // const response = await Api.syncLww(lastSyncAt, docsToUpload);

        // // Update local docs on success
        // for (let doc of docsToUpload) {
        //     // Delete the purged docs forever
        //     if (doc._purged) {
        //         await this._deleteById(doc._id);

        //         continue;
        //     }

        //     // Mark the uploaded docs as synced
        //     doc._synced = true;

        //     this.update(doc, false);
        // }

        // // Server returns a list of invalid docs that we should delete
        // await this._syncWipeInvalidDocs(response.data.invalid);

        // // Server returns data that we're missing locally. Save that data.
        // await this._syncDownloadedChanges(response.data.downloads);

        // // // Delete the docs that were purged/deleted from the server
        // // await this.syncDeletePurged(diffs.deleted);

        // this._syncing = false;

        // this.emit('synced');

        // return true;
    }

    /**
     * Sync - apply changes from the server.
     */
    async _syncDownloadedChanges(data) {
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
                this.update(docData, false);
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
        if (!docIds || !docIds.length) {
            return;
        }

        // Create/update local docs
        for (let id of docIds) {
            await this._deleteById(id);
        }

        return true;
    }

    // TODO: The original diff/patch sync code, diff/patch is temporarily
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

        this.emit('synced');

        return true;
    }

    /**
     * Check whether the app is online (whether there's Internet connection)
     * 
     * @return boolean
     */
    _isOnline() {
        return window.navigator.onLine;
    }
}

/**
 * Traits
 */
Object.assign(DB.prototype, HasEvents);

export default DB;