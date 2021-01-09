class DbDriver
{
    constructor(dbName) {
        this._dbName = dbName;
        this._db = null;
    }

    /**
     * Initialize the driver
     * 
     * @param {object} migrations
     * @return {Promise}
     */
    init(migrations) {
        throw 'Method "init()" is not implemented in the current DB driver!';
    }

    /**
     * Get a list of DB collection (table) names.
     * 
     * @return {array}
     */
    collections() {
        throw 'Method "collections()" is not implemented in the current DB driver!';
    }

    /**
     * Get a DB collection (table) reference to start building a query.
     * 
     * @param {string} name
     * @return {object}
     */
    collection(name) {
        throw 'Method "collection()" is not implemented in the current DB driver!';
    }

    /**
     * Add a global hook to the driver.
     * 
     * @param {string} name
     * @param {function} callback
     */
    hook(name, callback) {
        throw 'Method `hook` is not implemented in the current DB driver.';
    }

    /**
     * Initialize a SELECT query.
     * 
     * @return {object}
     */
    select() {
        throw 'Method "select()" is not implemented in the current DB driver!';
    }

    /**
     * Trash a document (soft delete).
     * 
     * @param {string} id 
     */
    trash(id) {
        throw 'Method `trash` is not implemented in the current DB driver.';
    }

    /**
     * Restore a trashed (soft deleted) document.
     * 
     * @param {string} id 
     */
    async restore(id) {
        throw 'Method `restore` is not implemented in the current DB driver.';
    }

    /**
     * Delete a document (mark as purged).
     * 
     * @param {string} id 
     */
    async delete(id) {
        throw 'Method `restore` is not implemented in the current DB driver.';
    }

    /**
     * Select only trashed documents
     */
    onlyTrashed() {
        throw 'Method `onlyTrashed` is not implemented in the current DB driver.';
    }

    // /**
    //  * Create a new document, return it.
    //  * 
    //  * @param {object} data 
    //  */
    // async create(data) {
    //     throw 'Method `create` is not implemented in the current DB driver.';
    // }

    // /**
    //  * Update an existing document.
    //  * 
    //  * @param {object} doc 
    //  */
    // async update(doc) {
    //     throw 'Method `update` is not implemented in the current DB driver.';
    // }

    // /**
    //  * Get a document by id.
    //  * 
    //  * @param {string} id 
    //  */
    // async getById(id) {
    //     throw 'Method `getById` is not implemented in the current DB driver.';
    // }

    // /**
    //  * Get query results.
    //  * 
    //  * @param {object} query 
    //  */
    // async get(query) {
    //     throw 'Method `get` is not implemented in the current DB driver.';
    // }

    // /**
    //  * Delete a record by id
    //  * 
    //  * @param {string} ids
    //  */
    // async deleteById(id) {
    //     throw 'Method `deleteById` is not implemented in the current DB driver.';
    // }

    // /**
    //  * Get ALL existing docs, including the trashed and purged/deleted ones.
    //  */
    // async getAll() {
    //     throw 'Method `getAll` is not implemented in the current DB driver.';
    // }

    // /**
    //  * Wipe out the whole DB
    //  */
    // async wipeDb() {
    //     throw 'Method `wipeDb` is not implemented in the current DB driver.';
    // }
}

export default DbDriver;