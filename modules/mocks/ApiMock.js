class ApiMock
{
    static routes = {
        '/api/apps/current': this._currentAppInfoResponse,
    };

    static get(url, options = {}) {
        return this._response(url, null, options);
    }

    static post(url, data = {}, options = {}) {
        return this._response(url, data, options);
    }

    static _response(url, data = {}, options = {}) {
        // See if there's a custom response
        const route = Object.keys(this.routes).find(i => url.endsWith(i));

        if (route && this.routes[route]) {
            const callback = this.routes[route];

            return new Promise((resolve, reject) => {
                resolve(callback(data, options));
            });
        }

        // Default - empty response
        return this._emptyResponse();
    }

    static _emptyResponse() {
        return new Promise((resolve, reject) => {
            resolve({
                data: {}
            });
        });
    }

    static _currentAppInfoResponse() {
        return {
            data: {
                name: 'Koti Cloud App',
                version: 'v1.0.0',
                version_updated_at: Date.now(),
                sdk_version: 'v1.0.0',
                icon: 'icon.png',
                rating: 5.0,
            },
        };
    }
}

export default ApiMock;