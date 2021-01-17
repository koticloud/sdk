import { v4 as uuidv4 } from 'uuid';

export default {
    _eventSubscriptions: {},

    emit(event, data) {
        if (!this._eventSubscriptions[event]) {
            return;
        }

        for (let key in this._eventSubscriptions[event]) {
            let callback = this._eventSubscriptions[event][key];

            callback(data);
        }
    },

    on(event, callback) {
        if (this._eventSubscriptions[event] === undefined) {
            this._eventSubscriptions[event] = {};
        }

        const id = `${uuidv4()}-${Date.now()}`;

        this._eventSubscriptions[event][id] = callback;

        return id;
    },

    off(eventId) {
        for (let event in this._eventSubscriptions) {
            if (this._eventSubscriptions[event][eventId]) {
                delete this._eventSubscriptions[event][eventId];
            }
        }
    }
}