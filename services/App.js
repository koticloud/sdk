import axios from 'axios';
import UI from './UI';

class App {
    constructor() {
        this._initialized = false;

        this.baseUrl = '';
        this._ui = null;
        this._cacheables = {};

        // App info
        this.info = {};
        this.installedVersion = null;
        this.latestVersion = null;

        this.localStorage = {
            appInfo: 'app.info',
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

        this.latestVersion = this.installedVersion;

        try {
            this.info = await this._fetchUpdatedAppInfo();
            
            this.latestVersion = this.info.version;
        } catch (error) {
            // Ignore exception
            console.error('Error while fetching current app info!');
        }

        return new Promise((resolve, reject) => {
            resolve(this.latestVersion != this.installedVersion);
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
            // If the current version is null, it probably means we're
            // installing the app for the first time. In this case just update
            // the local version and don't suggest to update.
            if (this.installedVersion === null) {
                this._updateLocalVersion(this.latestVersion);

                return false;
            }

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
    async _fetchUpdatedAppInfo() {
        return new Promise((resolve, reject) => {
            axios.get(`${this.baseUrl}/api/apps/current`)
                .then(response => {
                    resolve(response.data);
                })
                .catch(response => {
                    reject(response);
                });
        });
    }

    /**
     * Update the app (fetch/download the latest version)
     */
    async update() {
        if (!this._isInitialized()) {
            console.error('Initialize the app before calling update()');

            return;
        }

        if (!this.isOnline() || !window.caches) {
            return;
        }

        // Update the app
        window.caches.open('koti-cloud-noted').then(async (cache) => {
            const updatePromises = [];

            // Clear files that were cached until the next update
            for (let file of this._cacheables.untilUpdate) {
                updatePromises.push(cache.delete(file));
            }

            // After all the required files were deleted from cache
            Promise.all(updatePromises)
                .then(async (values) => {
                    // Unregister the service worker (will be updated on the next page
                    // refresh)
                    const registrations = await navigator.serviceWorker.getRegistrations();

                    for (let registration of registrations) {
                        await registration.unregister();
                    }

                    // Update version number in localStorage
                    this._updateLocalVersion(this.latestVersion);

                    // Ask the user a permission to restart the app now
                    const msg = `The app will be updated on the next restart. The operation requires internet connection and might take some time. Do you want to restart now?`;

                    this._ui.confirm(msg, 'koti-cloud-sdk--app-updated-dialog')
                        .then(res => {
                            // Refresh the page so that the removed files could
                            // downloaded & cached anew
                            location.reload();
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

    /**
     * Update app's version in LocalStorage
     * 
     * @param {string} newVersion 
     */
    _updateLocalVersion(newVersion) {
        localStorage.setItem(this.localStorage.appVersion, newVersion);
    }
}

export default App;