class ApiMock
{
    /**
     * Get current app info
     * 
     * @return {Promise}
     */
    static getCurrentAppInfo() {
        return new Promise((resolve, reject) => {
            const response = {
                data: {
                    name: 'Koti Cloud App',
                    version: 'v1.0.0',
                    version_updated_at: Date.now(),
                    sdk_version: 'v1.0.0',
                    icon: 'icon.png',
                    rating: 5.0,
                },
            };

            resolve(response);
        });
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
        return new Promise((resolve, reject) => {
            const response = {
                data: {
                    downloads: [],
                    invalid: [],
                },
            };

            resolve(response);
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
        return new Promise((resolve, reject) => {
            const response = {
                data: {
                    invalid: [],
                },
            };

            resolve(response);
        });
    }

    static _emptyResponse() {
        return new Promise((resolve, reject) => {
            resolve({
                data: {}
            });
        });
    }
}

export default ApiMock;