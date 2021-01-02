import axios from 'axios';
import ApiMock from './mocks/ApiMock';

class Api
{
    static get(url, options = {}) {
        if (this._isLocalhost()) {
            return ApiMock.get(url, options);
        }

        return axios.get(url, options);
    }

    static post(url, data = {}, options = {}) {
        if (this._isLocalhost()) {
            return ApiMock.post(url, data, options);
        }

        return axios.post(url, data, options);
    }

    /**
     * Determine whether the app is ran on localhost (dev mode)
     */
    static _isLocalhost() {
        return location.hostname === 'localhost';
    }
}

export default Api;