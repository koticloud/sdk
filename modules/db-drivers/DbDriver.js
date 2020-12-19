class DbDriver
{
    constructor(dbName) {
        this._dbName = dbName;
        this._db = null;
    }

    /**
     * Create a new document, return it.
     * 
     * @param {object} data 
     */
    async create(data) {
        return null;
    }

    /**
     * Get a document by id.
     * 
     * @param {string} id 
     */
    async getById(id) {
        return null;
    }

    /**
     * Get query results.
     * 
     * @param {object} query 
     */
    async get(query) {
        return [];
    }
}

export default DbDriver;