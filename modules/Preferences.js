import DB from './DB';
import HasEvents from '../traits/HasEvents';

class Preferences {
    constructor() {
        // Store data in a separate from the app's DB
        this._db = new DB('koti-cloud-app-preferences');
        this._collection = '_koti_cloud_app_preferences';
    }

    /**
     * Get a preference value.
     * 
     * @param {string} key
     * @param {mixed} defaultValue
     */
    async get(key, defaultValue = null) {
        const doc = await this._db.collection(this._collection)
            .where('key', key)
            .first();

        return doc ? doc.value : defaultValue;
    }

    /**
     * Get all preferences.
     */
    async getAll() {
        const data = await this._db.collection(this._collection).get();
        const prefs = {};

        data.docs.map(i => prefs[i.key] = i.value);

        return prefs;
    }

    /**
     * Set a preference value.
     * 
     * @param {string} key
     * @param {mixed} value
     * @param {bool} sync
     */
    async set(key, value, sync = true) {
        let doc = await this._db.collection(this._collection)
            .where('key', key)
            .first();

        if (!doc) {
            doc = { key };
        }

        doc.value = value;

        await this._db.collection(this._collection).updateOrCreate(doc);

        if (sync) {
            try {
                this._db.sync(false);

                this.emit('synced');
            } catch (e) {}
        }

        return true;
    }

    /**
     * Set multiple preference values.
     * 
     * @param {string} prefs
     */
    async setBulk(prefs) {
        for (let key in prefs) {
            await this.set(key, prefs[key], false);
        }

        try {
            this._db.sync(false);

            this.emit('synced');
        } catch (e) { }

        return true;
    }
}

/**
 * Traits
 */
Object.assign(Preferences.prototype, HasEvents);

export default Preferences;