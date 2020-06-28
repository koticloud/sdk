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
     * Update an existing document.
     * 
     * @param {object} doc 
     */
    async update(doc) {
        // Update an existing object
        await this._asyncRequest(
            this._getStore('readwrite'),
            'put',
            doc
        );

        // Return the updated object
        return doc;
    }

    /**
     * Get a document by id.
     * 
     * @param {string} id 
     */
    async getById(id, query = null) {
        let item = null;

        try {
            item = await this._asyncRequest(this._getStore(), 'get', id);
        } catch (error) {
            return null;
        }

        // Filter our the itme if it doesn't pass all the WHERE conditions
        if (query && !this._queryWhere(item, query.wheres)) {
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

            let results = [];

            // NOTE: this is left in case I want to implement pagination
            // const request = store.openCursor(IDBKeyRange.bound(skip, skip + take))
            const request = store.openCursor()

            request.onsuccess = (e) => {
                var cursor = e.target.result;

                if (cursor) {
                    // Filter out the results from foreign collections
                    if (query.collection && cursor.value._collection != query.collection) {
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

                    return;
                } else {    // No more items
                    // Sort the results to collect
                    if (query.orders.length) {
                        results = results.sort(this._sortFunction(query.orders));
                    }
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
            const operator = where.operator == '=' ? '==' : where.operator;
            let value = item[where.field];

            conditions.push(`${value} ${operator} ${where.value}`);
        }

        return eval(conditions.join(' && '));
    }

    /**
     * Array sorting function for query results.
     * 
     * @param {object} a 
     * @param {object} b 
     */
    _sortFunction(orders, i = 0) {
        const order = orders[i];
        const field = Object.keys(order)[0];
        const sortAsc = order[field] === 'asc';

        // Sort by multiple fields
        return (a, b) => {
            if (!a[field]) {
                return sortAsc ? -1 : 1;
            }

            if (!b[field]) {
                return sortAsc ? 1 : -1;
            }

            if (a[field] < b[field]) {
                return sortAsc ? -1 : 1;
            }

            if (a[field] > b[field]) {
                return sortAsc ? 1 : -1;
            }

            // If the values are similar - sort by the next field if any
            if (orders[i + 1] !== undefined && orders[i + 1] !== null) {
                return this._sortFunction(orders, i + 1)(a, b);
            }

            return 0;
        }
    }
}

export default IndexedDB;