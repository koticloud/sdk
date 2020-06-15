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
    async _asyncRequest(object, method, argument) {
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
    _getStore(mode = 'readonly') {
        const transaction = this._db.transaction(this._storeName, mode);

        return transaction.objectStore(this._storeName);
    }

    /**
     * Get cursor for a store.
     * 
     * @param {object} store 
     */
    async _getCursor(store) {
        return new Promise((resolve, reject) => {
            const request = store.openCursor();

            request.onsuccess = function () {
                console.log('aha!');
                resolve(request.result);
            };

            request.onerror = function () {
                reject(request.error);
            };
        });
    }

    /**
     * Create a new document
     * 
     * @param {object} data 
     */
    async create(data) {
        // Create a new object, get its ID
        const id = await this._asyncRequest(
            this._getStore('readwrite'),
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
        let item = null;

        try {
            item = await this._asyncRequest(this._getStore(), 'get', id);
        } catch (error) {
            return null;
        }

        return item;
    }

    /**
     * Get query results.
     * 
     * @param {object} query 
     */
    async get(query) {
        return new Promise((resolve, reject) => {
            const store = this._getStore();

            const results = [];

            // NOTE: this is left in case I want to implement pagination
            // const request = store.openCursor(IDBKeyRange.bound(skip, skip + take))
            const request = store.openCursor()

            request.onsuccess = (e) => {
                var cursor = e.target.result;

                if (cursor) {
                    // Filter out the results from foreign collections
                    if (cursor.value._collection != query.collection) {
                        cursor.continue();

                        return;
                    }

                    // Filter our the results that don't pass all the WHERE
                    // conditions
                    if (!this._queryWhere(cursor.value, query.wheres)) {
                        cursor.continue();

                        return;
                    }

                    results.push(cursor.value);

                    cursor.continue();
                }

                resolve(results);
            }

            request.onerror = function (e) {
                if (e.type === 'success') {
                    resolve(results);
                } else {
                    reject(e.target.error);
                }
            };
        });
    }

    /**
     * Does the item pass the WHERE conditions?
     * 
     * @param {object} item 
     * @param {array} wheres 
     */
    _queryWhere(item, wheres) {
        if (!wheres || !wheres.length) {
            return true;
        }

        // TODO: For now all the WHEREs are joined via AND, which is too simple.
        // Add the ability to add OR and groupped subconditions like in Eloquent
        const conditions = [];

        for (let where of wheres) {
            conditions.push(`${item[where.field]} ${where.operator} ${where.value}`);
        }

        return eval(conditions.join(' && '));
    }
}

export default IndexedDB;