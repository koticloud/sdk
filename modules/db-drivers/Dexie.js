import DbDriver from "./DbDriver";
import { Dexie as RealDexie } from 'dexie';

class Dexie extends DbDriver {
    constructor(dbName) {
        super(dbName);

        this._collections = {};
    }

    /**
     * Initialize the driver
     * 
     * @param {object} migrations
     * @return {Promise}
     */
    init(migrations) {
        return new Promise((resolve, reject) => {
            // Initialize Dexie
            this._db = new RealDexie(this._dbName);

            // Apply the DB migrations, one version at a time
            for (let version in migrations) {
                const schema = migrations[version].schema;

                for (let tableName in schema) {
                    // Format schema in the Dexie format - a comma-separated
                    // list of fields
                    schema[tableName] = schema[tableName].join(',');
                }

                // Run a migration for the version (will be ignored if the
                // version has been already migrated)
                this._db.version(version).stores(schema);
            }

            resolve(this);
        });
    }

    /**
     * Get a list of DB collection (table) names.
     * 
     * @return {array}
     */
    collections() {
        if (!this._db) {
            throw 'Call init() before working with a driver!';
        }

        return this._db.tables.map(i => i.name);
    }

    /**
     * Get a DB collection (table) reference to start building a query.
     * 
     * @param {string} name
     * @return {object}
     */
    collection(name) {
        if (!this._db) {
            throw 'Call init() before working with a driver!';
        }

        const table = this._db[name];

        const proxy = new Proxy(table, {
            get: (obj, field) => {
                if (field === 'trash') {
                    return this.trash;
                }

                if (field === 'restore') {
                    return this.restore;
                }

                // This overrides the default Dixie method
                if (field === 'delete') {
                    return this.delete;
                }

                if (field === 'select') {
                    return this.select;
                }

                if (field in obj) {
                    return obj[field];
                }
            }
        });

        proxy._table = table;
        proxy._driver = this;

        return proxy;
    }

    /**
     * Add a global hook to the driver.
     * 
     * @param {string} name
     * @param {function} callback
     */
    hook(name, callback) {
        if (['creating', 'updating'].indexOf(name) === -1) {
            return;
        }

        // Apply the hook to each table
        for (let table of this._db.tables) {
            if (name === 'creating') {
                table.hook(name, function (primKey, obj, transaction) {
                    callback(table.name, primKey, obj);
                });
            } else if (name === 'updating') {
                table.hook(name, function (modifications, primKey, obj, transaction) {
                    let modifiedObj = Object.assign({}, obj)

                    callback(table.name, primKey, modifiedObj);

                    const modified = {};

                    for (let field in obj) {
                        if (obj[field] !== modifiedObj[field]) {
                            modified[field] = modifiedObj[field];
                        }
                    }

                    return modified;
                });
            }
        }
    }

    /**
     * Initialize a SELECT query.
     * 
     * @return {object}
     */
    select() {
        const collection = this._table.filter(function (item) {
            return !item._purged && !item._deleted_at;
        });

        const proxy = new Proxy(collection, {
            get: (obj, field) => {
                if (field === 'onlyTrashed') {
                    return this._driver.onlyTrashed;
                }

                if (field in obj) {
                    return obj[field];
                }
            }
        });

        proxy._collection = collection;
        proxy._table = this._table;
        proxy._driver = this._driver;

        return proxy;
    }

    /**
     * Trash a document (soft delete).
     * 
     * @param {string} id 
     */
    async trash(id) {
        const doc = await this._table.get(id);

        if (!doc) {
            return false;
        }

        doc._deleted_at = Date.now() / 1000;

        await this._table.put(doc);

        return true;
    }

    /**
     * Restore a trashed (soft deleted) document.
     * 
     * @param {string} id 
     */
    async restore(id) {
        const doc = await this._table.get(id);

        if (!doc) {
            return false;
        }

        doc._deleted_at = null;

        await this._table.put(doc);

        return true;
    }

    /**
      * Delete a document (mark as purged).
      * 
      * @param {string} id 
      */
    async delete(id) {
        const doc = await this._table.get(id);

        if (!doc) {
            return false;
        }

        doc._deleted_at = Date.now() / 1000;
        doc._purged = 1;

        await this._table.put(doc);

        return true;
    }

    /**
     * Select only trashed documents
     */
    onlyTrashed() {
        // this._table.filter(function (item) {
        //     console.log(item);
        //     return false;
        // });
        // console.log(this._table);
        return this._collection.and(function (item) {
            console.log(item);
        });
    }
}

export default Dexie;