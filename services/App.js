import axios from 'axios';
import UI from './UI';

class App {
    constructor() {
        this._initialized = false;

        this.baseUrl = '';
        this._ui = null;
        this._cacheables = {};

        // App info
        this.installedVersion = null;
        this.latestVersion = null;

        this.localStorage = {
            appVersion: 'app.version',
        };
    }

    /**
     * Initialize the app
     * 
     * @return void
     */
    init(options) {
        this._readCachedAppInfo();

        this.setCacheables(options.cacheables);

        this._ui = new UI();

        this._registerServiceWorker(options.serviceWorker);

        const locationPaths = location.host.split('\.');
        this.baseUrl = `${location.protocol}//${locationPaths.slice(-2).join('\.')}`;

        this._initialized = true;
    }

    /**
     * Set the _cacheables object
     * 
     * @param {object} cacheables 
     */
    setCacheables(cacheables) {
        this._cacheables = typeof cacheables === 'object'
            ? cacheables
            : {};
        
        // Merge default values with real values
        this._cacheables = Object.assign({
            forever: [],
            untilUpdate: [],
        }, this._cacheables);
    }

    _registerServiceWorker(swPath) {
        if (!swPath) {
            throw 'App - no sevice worker provided!';
        }

        // Register the PWAs service worker
        window.onload = () => {
            'use strict';

            if ('serviceWorker' in navigator) {
                navigator.serviceWorker
                    .register(swPath)
                    .then((reg) => {
                        // Do nothing
                    })
                    .catch(err => {
                        console.error('ServiceWorker registration failed: ', err);
                    });
            }
        };
    }

    /**
     * Check whether the app has been initialized
     */
    _isInitialized() {
        return this._initialized;
    }

    /**
     * Read cached values (info about the app etc)
     */
    _readCachedAppInfo() {
        this.installedVersion = localStorage.getItem(this.localStorage.appVersion);
    }

    /**
     * Check whether the app is online (whether there's Internet connection)
     * 
     * @return boolean
     */
    isOnline() {
        return window.navigator.onLine;
    }

    /**
     * Check whether the app has a newer version than the installed one
     * 
     * @response boolean
     */
    async hasUpdates() {
        if (!this._isInitialized()) {
            console.error('Initialize the app before calling hasUpdates()');

            return new Promise((resolve, reject) => resolve(false));
        }

        if (!this.isOnline()) {
            return new Promise((resolve, reject) => resolve(false));
        }

        let latestVersion = this.installedVersion;

        try {
            latestVersion = await this._fetchLatestVersion();

            this.latestVersion = latestVersion;
        } catch (error) {
            // Ignore exception
        }

        return new Promise((resolve, reject) => {
            resolve(latestVersion != this.installedVersion);
        });
    }

    /**
     * If the app has a newer version than the installed one - notify the user
     * and offer to update
     */
    async checkForUpdates() {
        if (!this._isInitialized()) {
            console.error('Initialize the app before calling checkForUpdates()');

            return;
        }

        if (!this.isOnline()) {
            return;
        }

        if (await this.hasUpdates()) {
            const msg = `A new version of this app is available. Do you want to update now?`;

            this._ui.confirm(msg, 'koti-cloud-sdk--app-update-available-dialog')
                .then(res => {
                    this.update();
                })
                .catch(res => {
                    // Do nothing
                });
        }
    }

    /**
     * Fetch the latest version of the current app from the API
     * 
     * @return Promise
     */
    async _fetchLatestVersion() {
        return new Promise((resolve, reject) => {
            axios.get(`${this.baseUrl}/api/app/version`)
                .then(response => {
                    resolve(response.data.version);
                })
                .catch(response => {
                    reject(response);
                });
        });
    }

    /**
     * Update the app (fetch/download the latest version)
     */
    update() {
        if (!this._isInitialized()) {
            console.error('Initialize the app before calling update()');

            return;
        }

        if (!this.isOnline() || !window.caches) {
            return;
        }

        // Update the app
        window.caches.open('koti-cloud-noted').then((cache) => {
            const updatePromises = [];

            // Clear files that were cached until the next update
            for (let file of this._cacheables.untilUpdate) {
                updatePromises.push(cache.delete(file));
            }

            // After all the required files were deleted from cache
            Promise.all(updatePromises)
                .then((values) => {
                    // Update version number in localStorage
                    localStorage.setItem(
                        this.localStorage.appVersion,
                        this.latestVersion
                    );

                    // Ask the user a permission to restart the app now
                    const msg = `The app will be updated on the next restart. The operation requires internet connection and might take some time. Do you want to restart now?`;

                    this._ui.confirm(msg, 'koti-cloud-sdk--app-updated-dialog')
                        .then(res => {
                            // Refresh the page so that the removed files could
                            // downloaded & cached anew
                            location.reload(true);
                        })
                        .catch(res => {
                            // Do nothing
                        });
                })
                .catch((response) => {
                    // Notify user about a fail
                    this._ui.notify('Some or all of the files failed to update. You can restart the app and try again.', 'error');
                });
        });
    }
}

export default App;