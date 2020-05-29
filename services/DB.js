import PouchDB from 'pouchdb';
PouchDB.plugin(require('pouchdb-find').default);

class DB
{
    constructor(name) {
        this._db = new PouchDB(name);
        this.isQuery = false;
        this.orders = [];
    }

    /**
     * Create a new document. Throws an exception if the id inside the data
     * object is not unique.
     * 
     * @param {object} data 
     */
    async create(data) {
        const response = data._id
            ? await this._db.put(data)
            : await this._db.post(data);

        return this.get(response.id);
    }

    /**
     * Create a new document if it doesn't exist. Return the document if it does
     * exist.
     * object is not unique.
     * 
     * @param {object} data 
     */
    async firstOrCreate(data) {
        let doc;

        try {
            doc = await this._db.get(data._id);

            return doc;
        } catch (error) {
            // Document doesn't exist
        }

        // Create a document
        return this.create(data);
    }

    /**
     * Update an existing document.
     * 
     * @param {PouchDB doc} doc 
     */
    async update(doc) {
        await this._db.put(doc);

        return this.get(doc._id);
    }

    /**
     * Update an existing document or create a new one if it doesn't exist.
     * 
     * @param {PouchDB doc}|obeject data 
     */
    async updateOrCreate(data) {
        // The create method already works like update-or-create.
        return this.create(data);
    }

    /**
     * (soft) Delete a document.
     * 
     * @param {PouchDB document} doc 
     */
    async remove(doc) {
        // The remove() methods removes all the fields from the document. If you
        // need those fields the official documentation recommends just setting
        // "_deleted = true" manually.
        // return this._db.remove(doc);

        doc._deleted = true;
        doc.deleted_at = new Date();

        return this._db.put(doc);
    }

    /**
     * Get a document by id or return query results.
     * 
     * @param {string}|null id 
     */
    async get(id) {
        if (!this.isQuery || id) {
            return this._db.get(id.toString());
        }

        // Query builder
        await this._db.createIndex({
            index: {
                fields: this.orders.map(item => Object.keys(item)[0])
            }
        });

        const res = this._db.find({
            selector: {},
            sort: this.orders,
        });

        // Reset query builder
        this.isQuery = false;
        this.orders = [];

        return res;
    }

    /**
     * Get a deleted object by id.
     * 
     * @param {string} id 
     */
    async getDeleted(id) {
        const res = await this._db.changes({
            selector: { _deleted: true, _id: id },
            include_docs: true,
        });

        if (!res.results.length) {
            throw 'Document not found.';
        }

        return res.results[0].doc;
    }


    /**
     * Get all doucments.
     */
    async all() {
        return this._db.allDocs({
            include_docs: true,
        });
    }

    /**
     * Get all deleted doucments.
     */
    async allDeleted() {
        const res = await this._db.changes({
            selector: { '_deleted': true },
            include_docs: true,
        });

        // Extract docs, reverse order (newly deleted first)
        return {
            docs: res.results.map(item => item.doc).reverse(),
        };
    }

    orderBy(field, dir = 'asc') {
        const exists = this.orders.find(order => {
            return order[field];
        });

        if (exists) {
            exists[field] = dir;
        } else {
            this.orders.push({ [field]: dir });
        }

        this.isQuery = true;

        return this;
    }

    /**
     * Sync the DB with Koti Cloud server.
     */
    async sync() {
        const hostParts = location.host.split('.');
        const host = `${location.protocol}//${hostParts[hostParts.length - 2]}.${hostParts[hostParts.length - 1]}`;

        const remoteDb = new DB(`${host}/api/i/app-user-db/sync/db/`);

        return this._db.sync(remoteDb._db, {
            // live: true,
            // retry: true
        });
    }
}

export default DB;