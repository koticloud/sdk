import axios from 'axios';
import ApiMock from './mocks/ApiMock';

class Api {
    /**
     * Get the API's base URL
     * 
     * @return {string}
     */
    static baseUrl() {
        const locationPaths = location.host.split('\.');

        return `${location.protocol}//${locationPaths.slice(-2).join('\.')}`;
    }

    /**
     * Get current app info
     * 
     * @return {Promise}
     */
    static getCurrentAppInfo() {
        if (this._shouldMock()) {
            return ApiMock.getCurrentAppInfo();
        }

        return axios.post(`/api/apps/current`);
    }

    /**
     * Sync the DB: Last-Write-Wins approach
     * 
     * @param {integer} lastSyncAt timestamp
     * @param {array} docsToUpload
     * 
     * @return {Promise}
     */
    static syncLww(lastSyncAt, docsToUpload) {
        if (this._shouldMock()) {
            return ApiMock.syncLww();
        }

        return axios.post('/api/apps/db/sync/lww', {
            last_sync_at: lastSyncAt,
            uploads: docsToUpload,
        }, {
            timeout: 1000 * 30, // Timeout 30 seconds
        });
    }

    /**
     * Validate user's local docs on the server
     * 
     * @param {array} docIds
     * 
     * @return {Promise}
     */
    static validateDocs(docIds) {
        if (this._shouldMock()) {
            return ApiMock.validateDocs();
        }

        return axios.post('/api/apps/db/validate-docs', {
            docs: docIds,
        }, {
            timeout: 1000 * 30, // Timeout 30 seconds
        });
    }

    /**
     * Determine whether the API class should be mocked
     */
    static _shouldMock() {
        return ['localhost', '127.0.0.1'].indexOf(location.hostname) !== -1;
    }
}

export default Api;