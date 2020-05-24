import PouchDB from 'pouchdb';

class DB
{
    constructor(name) {
        this._db = new PouchDB(name);
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
     * Get a doucment by id.
     * 
     * @param {string} id 
     */
    async get(id) {
        return this._db.get(id.toString());
    }

    /**
     * (soft) Delete a document.
     * 
     * @param {PouchDB document} doc 
     */
    async remove(doc) {
        return this._db.remove(doc);
    }
}

export default DB;