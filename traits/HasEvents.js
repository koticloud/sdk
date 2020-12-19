export default {
    _eventSubscriptions: {},

    emit(event) {
        if (!this._eventSubscriptions[event]) {
            return;
        }

        for (let callback of this._eventSubscriptions[event]) {
            callback();
        }
    },

    on(event, callback) {
        if (this._eventSubscriptions[event] === undefined) {
            this._eventSubscriptions[event] = [];
        }

        this._eventSubscriptions[event].push(callback);
    }
}