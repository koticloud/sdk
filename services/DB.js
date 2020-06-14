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
        this._query = {
            collection: null,
        };
        // this.orders = [];
    }

    /**
     * Initializ the preffered database driver
     */
    async initDriver() {
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
    generateUniqueId() {
        return uuidv4();
    }

    /**
     * Create a new document. Throws an exception if the id inside the data
     * object is not unique.
     * 
     * @param {object} data 
     */
    async create(data) {
        // Make sure the driver is initialized
        await this.initDriver();

        // Append meta data
        data = Object.assign(data, {
            _collection: this._query.collection,
            _id: this.generateUniqueId(),
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

    // /**
    //  * Get a document by id or return query results.
    //  * 
    //  * @param {string}|null id 
    //  */
    // async get(id) {
    //     if (!this.isQuery || id) {
    //         return this._db.get(id.toString());
    //     }

    //     // Query builder
    //     await this._db.createIndex({
    //         index: {
    //             fields: this.orders.map(item => Object.keys(item)[0])
    //         }
    //     });

    //     const res = this._db.find({
    //         selector: {},
    //         sort: this.orders,
    //     });

    //     // Reset query builder
    //     this.isQuery = false;
    //     this.orders = [];

    //     return res;
    // }

    // /**
    //  * Get a deleted object by id.
    //  * 
    //  * @param {string} id 
    //  */
    // async getDeleted(id) {
    //     const res = await this._db.changes({
    //         selector: { _deleted: true, _id: id },
    //         include_docs: true,
    //     });

    //     if (!res.results.length) {
    //         throw 'Document not found.';
    //     }

    //     return res.results[0].doc;
    // }


    // /**
    //  * Get all doucments.
    //  */
    // async all() {
    //     return this._db.allDocs({
    //         include_docs: true,
    //     });
    // }

    // /**
    //  * Get all deleted doucments.
    //  */
    // async allDeleted() {
    //     const res = await this._db.changes({
    //         selector: { '_deleted': true },
    //         include_docs: true,
    //     });

    //     // Extract docs, reverse order (newly deleted first)
    //     return {
    //         docs: res.results.map(item => item.doc).reverse(),
    //     };
    // }

    // orderBy(field, dir = 'asc') {
    //     const exists = this.orders.find(order => {
    //         return order[field];
    //     });

    //     if (exists) {
    //         exists[field] = dir;
    //     } else {
    //         this.orders.push({ [field]: dir });
    //     }

    //     this.isQuery = true;

    //     return this;
    // }

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