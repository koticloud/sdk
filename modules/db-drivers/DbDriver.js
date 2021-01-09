class DbDriver
{
    constructor(dbName) {
        this._dbName = dbName;
        this._db = null;
    }

    /**
     * Initialize the driver
     */
    init() {
        throw 'method "init()" is not implemented in the current DB driver.';
    }

    /**
     * Create a new document, return it.
     * 
     * @param {object} data
     * @return {object} document
     */
    async create(data) {
        throw 'method "create()" is not implemented in the current DB driver.';
    }

    /**
     * Update an existing document.
     * 
     * @param {object} doc 
     * @return {object} document
     */
    async update(doc) {
        throw 'method "update()" is not implemented in the current DB driver.';
    }

    /**
     * Get a document by id.
     * 
     * @param {string} id 
     * @return {object} document
     */
    async getById(id) {
        throw 'method "getById()" is not implemented in the current DB driver.';
    }

    /**
     * Get query results.
     * 
     * @param {object} query
     * @return {object}
     */
    async get(query) {
        throw 'method "get()" is not implemented in the current DB driver.';
    }

    /**
     * Delete a record by id.
     * 
     * @param {string} id
     */
    async deleteById(id) {
        throw 'method "deleteById()" is not implemented in the current DB driver.';
    }

    /**
     * Get ALL docs, including the trashed and purged/deleted ones.
     * 
     * @return {array}
     */
    async getAll() {
        throw 'method "getAll()" is not implemented in the current DB driver.';
    }

    /**
     * Wipe out the entire DB.
     */
    async wipeDb() {
        throw 'method "wipeDb()" is not implemented in the current DB driver.';
    }
}

export default DbDriver;