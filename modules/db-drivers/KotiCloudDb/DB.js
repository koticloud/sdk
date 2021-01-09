import DbDriver from "../DbDriver";
import Collection from "./Collection";

class IndexedDB extends DbDriver
{
    constructor(dbName) {
        super(dbName);
    }

    /**
     * Initialize the driver
     */
    init() {
        return new Promise((resolve, reject) => {
            const openRequest = indexedDB.open(this._dbName);

            // openRequest.onupgradeneeded = (e) => {
            //     // Create a single main store for all the data to not deal with
            //     // schema management/upgrades
            //     let db = openRequest.result;

            //     if (!db.objectStoreNames.contains(this._collectionName)) {
            //         db.createObjectStore(this._collectionName, {
            //             keyPath: '_id'
            //         });
            //     }
            // };

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
     * Begin building a query for a collection.
     * 
     * @param {string} name
     * @return {mixed}
     */
    collection(name) {
        if (!name) {
            return null;
        }

        return new Collection(this._db, name);
    }

    /**
     * Perform an IndexedDB request within a Promise.
     * 
     * @param {object} store 
     * @param {string} method 
     * @param {mixed} argument 
     */
    async _asyncRequest(store, method, argument) {
        return new Promise((resolve, reject) => {
            const request = store[method](argument);

            request.onsuccess = function () {
                resolve(request.result);
            };

            request.onerror = function () {
                reject(request.error);
            };
        });
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
            this._getStore(data._collection, 'readwrite'),
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
            this._getStore(doc._collection, 'readwrite'),
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
            item = await this._asyncRequest(this._getStore(query._collection), 'get', id);
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
     * Delete a record by id.
     * 
     * @param {string} storeName
     * @param {string} id
     */
    async deleteById(storeName, id) {
        return await this._asyncRequest(this._getStore(storeName, 'readwrite'), 'delete', id);
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
        // Add the ability to add OR and groupped subconditions like in Eloquent
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
}

export default IndexedDB;