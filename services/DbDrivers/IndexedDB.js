import DbDriver from "./DbDriver";

class IndexedDB extends DbDriver
{
    constructor(dbName) {
        super(dbName);

        this._storeName = 'main-store';

        return new Promise((resolve, reject) => {
            const openRequest = indexedDB.open(dbName);

            openRequest.onupgradeneeded = function () {
                // Create a single main store for all the data to not deal with
                // schema management/upgrades
                let db = openRequest.result;

                if (!db.objectStoreNames.contains(this._storeName)) {
                    db.createObjectStore('main-store', {
                        keyPath: '_id'
                    });
                }
            };

            openRequest.onerror = function () {
                reject(openRequest.error);
            };

            openRequest.onsuccess = () => {
                this._db = openRequest.result;

                resolve(this);
            };
        });
    }

    /**
     * Perform an IndexedDB request within a Promise.
     * 
     * @param {object} object 
     * @param {string} method 
     * @param {mixed} argument 
     */
    async asyncRequest(object, method, argument) {
        return new Promise((resolve, reject) => {
            const request = object[method](argument);

            request.onsuccess = function () {
                resolve(request.result);
            };

            request.onerror = function () {
                reject(request.error);
            };
        });
    }

    /**
     * Get a store object ready to perform a transation.
     * 
     * @param {string} mode 
     */
    getStore(mode = 'readonly') {
        const transaction = this._db.transaction(this._storeName, mode);

        return transaction.objectStore(this._storeName);
    }

    /**
     * Create a new document
     * 
     * @param {object} data 
     */
    async create(data) {
        // Create a new object, get its ID
        const id = await this.asyncRequest(
            this.getStore('readwrite'),
            'add',
            data
        );

        // Return the newly created object
        return await this.getById(id);
    }

    /**
     * Get a document by id.
     * 
     * @param {string} id 
     */
    async getById(id) {
        try {
            const item = await this.asyncRequest(this.getStore(), 'get', id);
        } catch (error) {
            return null;
        }
    }
}

export default IndexedDB;