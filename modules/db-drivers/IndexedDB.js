import DbDriver from "./DbDriver";

class IndexedDB extends DbDriver
{
    constructor(dbName) {
        super(dbName);

        this._storeName = 'main-store';
    }

    /**
     * Initialize the driver
     */
    init() {
        return new Promise((resolve, reject) => {
            const openRequest = indexedDB.open(this._dbName);

            openRequest.onupgradeneeded = (e) => {
                // Create a single main store for all the data to not deal with
                // schema management/upgrades
                let db = openRequest.result;

                if (!db.objectStoreNames.contains(this._storeName)) {
                    const store = db.createObjectStore(this._storeName, {
                        keyPath: '_id'
                    });

                    // Create indexes for faster data retrieval
                    store.createIndex(
                        'collection',
                        '_collection',
                        { unique: false }
                    );
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
     * Create a new document, return it.
     * 
     * @param {object} data
     * @return {object} document 
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
     * @return {object} document
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
     * @return {object} document
     */
    async getById(id, query = null) {
        let item = null;

        try {
            item = await this._asyncRequest(this._getStore(), 'get', id);
        } catch (error) {
            return null;
        }

        // Filter out the item if it doesn't pass all the WHERE conditions
        if (query && !this._queryWhere(item, query.wheres)) {
            return null;
        }

        return item;
    }

    /**
     * Get query results.
     * 
     * @param {object} query
     * @return {object}
     */
    async get(query) {
        return new Promise((resolve, reject) => {
            const store = this._getStore();
            let request;

            if (query.collection) {
                request = store.index('collection').openCursor(query.collection);
            } else {
                request = store.openCursor();
            }

            let results = {
                docs: [],
                total: 0,
            };

            request.onsuccess = (e) => {
                let cursor = e.target.result;

                if (cursor) {
                    // Filter out the results that don't pass all the WHERE
                    // conditions
                    if (!this._queryWhere(cursor.value, query.wheres)) {
                        cursor.continue();

                        return;
                    }

                    results.docs.push(cursor.value);

                    cursor.continue();
                } else {    // No more items
                    // Sort the final results
                    if (query.orders.length) {
                        results.docs = results.docs.sort(this._sortFunction(query.orders));
                    }

                    // Count the total amount of docs
                    results.total = results.docs.length;

                    // Take a subset of the results
                    const from = query.from ? query.from : 0;
                    const to = (query.limit ? query.limit : results.total)
                        + from;

                    results.docs = results.docs.slice(from, to);

                    // Group the results
                    results.docs = this._groupResults(results.docs, query.groupBys);

                    resolve(results);
                }
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
     * Get the list of all the existing collections.
     * 
     * @return {Array}
     */
    async getCollections() {
        return new Promise((resolve, reject) => {
            const store = this._getStore();
            let request;

            request = store.index('collection').openCursor(null, 'nextunique');

            let results = [];

            request.onsuccess = (e) => {
                let cursor = e.target.result;

                if (cursor) {
                    // Filter out the results that don't pass all the WHERE
                    // conditions
                    results.push(cursor.value._collection);

                    cursor.continue();
                } else {    // No more items
                    // Sort the final results
                    results = results.sort();

                    resolve(results);
                }
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
     * Delete a record by id.
     * 
     * @param {string} id
     */
    async deleteById(id) {
        return await this._asyncRequest(this._getStore('readwrite'), 'delete', id);
    }

    /**
     * Get ALL docs, including the trashed and purged/deleted ones.
     * 
     * @return {array}
     */
    async getAll() {
        return await this._asyncRequest(this._getStore(), 'getAll');
    }

    /**
     * Wipe out the entire DB.
     */
    async wipeDb() {
        return await this._asyncRequest(
            this._getStore('readwrite'),
            'clear'
        );
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
        // Add the ability to add OR and grouppd subconditions like in Eloquent
        const conditions = [];

        for (let where of wheres) {
            const operator = where.operator == '=' ? '==' : where.operator;
            let value = item[where.field];
            let whereValue = where.value;

            if (typeof value === 'string') {
                value = `'${value}'`;
            }

            if (typeof whereValue === 'string') {
                whereValue = `'${whereValue}'`;
            }

            conditions.push(`${value} ${operator} ${whereValue}`);
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

    /**
     * Group results by specified fields
     * 
     * @param {array} collection 
     * @param {array} groupBys 
     * @param {string} previousGroup 
     */
    _groupResults(collection, groupBys = [], previousGroup = null) {
        if (!groupBys || !groupBys.length) {
            return collection;
        }

        const grouped = {};
        const field = groupBys.shift();

        for (let item of collection) {
            if (!grouped[item[field]]) {
                grouped[item[field]] = [];
            }

            if (groupBys[0]) {
                const subCollection = collection.filter(i => i[field] === item[field]);

                // If we don't clone the array, it'll be passed by reference
                grouped[item[field]] = this._groupResults(
                    subCollection,
                    groupBys.map(i => i)
                );
            } else { 
                grouped[item[field]].push(item);
            }
        }

        return grouped;
    }
}

export default IndexedDB;