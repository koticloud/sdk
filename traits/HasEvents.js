import { v4 as uuidv4 } from 'uuid';

export default {
    _eventSubscriptions: {},

    emit(event, data) {
        const group = this.constructor.name;

        if (!this._eventSubscriptions[group] || !this._eventSubscriptions[group][event]) {
            return;
        }

        for (let key in this._eventSubscriptions[group][event]) {
            let callback = this._eventSubscriptions[group][event][key];

            callback(data);
        }
    },

    on(event, callback) {
        const group = this.constructor.name;

        if (this._eventSubscriptions[group] === undefined) {
            this._eventSubscriptions[group] = {};
        }

        if (this._eventSubscriptions[group][event] === undefined) {
            this._eventSubscriptions[group][event] = {};
        }

        const id = `${uuidv4()}-${Date.now()}`;

        this._eventSubscriptions[group][event][id] = callback;

        return id;
    },

    off(eventId) {
        const group = this.constructor.name;

        if (!this._eventSubscriptions[group]) {
            return;
        }

        for (let event in this._eventSubscriptions[group]) {
            if (this._eventSubscriptions[group][event][eventId]) {
                delete this._eventSubscriptions[group][event][eventId];
            }
        }
    }
}