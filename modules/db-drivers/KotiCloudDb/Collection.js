class Collection
{
    constructor(db, collection) {
        this._db = db;
        this._collection = collection;
    }

    /**
     * Get query results.
     * 
     * @param {object} query
     * @return {object}
     */
    async get(query) {
        return new Promise((resolve, reject) => {
            const store = this._getStore(this._collection);
            const request = store.openCursor()

            let results = [];

            request.onsuccess = (e) => {
                var cursor = e.target.result;

                if (cursor) {
                    // TODO: This is not needed anymore
                    // // Filter out the results from foreign collections
                    // if (this._collection && cursor.value._collection != this._collection) {
                    //     cursor.continue();

                    //     return;
                    // }

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
     * Get a store object ready to perform a transation.
     * 
     * @param {string} storeName 
     * @param {string} mode 
     */
    _getStore(storeName, mode = 'readonly') {
        // Create the store if it doesn't exist yet
        if (!this._db.objectStoreNames.contains(storeName)) {
            console.log('Let use create a store: ' + storeName);
        //     this._db.createObjectStore(storeName, {
        //         keyPath: '_id'
        //     });

            const transaction = this._db.transaction([], 'readwrite');

            transaction.oncomplete = function () {
                console.log("Success transaction");
            };
        } else {
            const transaction = this._db.transaction(storeName, mode);
    
            return transaction.objectStore(storeName);
        }
    }
}

export default Collection;