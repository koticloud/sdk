import Component from './Component.js';

class OsOverlay extends Component
{
    constructor(ui) {
        super(ui);

        this._touchFromY;
        this._touchToY;
    }

    /**
     * Get the component's main element class name
     * 
     * @return string
     */
    _getClass() {
        return 'kc--os-overlay';
    }

    /**
     * Initialize the component
     * 
     * @return void
     */
    initialize() {
        this._el = document.createElement('div');
        this._el.classList.add(this._getClass());
        this._el.innerHTML = this._getTemplate();

        this._body.appendChild(this._el);

        this._registerEvents();
    }

    /**
     * Get the component's inner HTML
     * 
     * @return string
     */
    _getTemplate() {
        return `
            <div class="kc--os-overlay--actions">
                <a href="#" class="kc--os-overlay--btn-link kc--os-overlay--actions--clear-local-data">Clear Local Data</a>
            </div>
        `;
    }

    /**
     * Register the component events
     * 
     * @return void
     */
    _registerEvents() {
        // Toggle overlay on UI toggle-os-overlay event
        this._ui.on('toggle-os-overlay', () => {
            this._toggleSelf();
        });

        // Close overlay on empty space click
        this._el.addEventListener('click', (e) => {
            if (e.target.classList.contains('kc--os-overlay')) {
                this._toggleSelf();
            }
        });

        // On "Clear Local Data" press
        document.querySelector('.kc--os-overlay--actions--clear-local-data')
            .addEventListener('click', (e) => {
                e.preventDefault();

                this._clearLocalData();
            });
    }

    _toggleSelf() {
        if (!this._el.classList.contains('kc--os-overlay--show')) {
            const offset = document.querySelector('.kc--panel')
                .clientHeight + 2; // 2px = border-bottom height

            this._el.style.marginTop = `${offset}px`;
        }

        this._el.classList.toggle('kc--os-overlay--show');
    }

    _clearLocalData() {
        this._toggleSelf();

        const confirmation = 'Besides being stored on Koti Cloud servers, all your app data is also stored locally after you\'ve used the app even after you log out from Koti Cloud (unfortunately, this is a Koti Cloud limitation for the time being). If other people have access to your device or you are using the app on someone else\'s device, you probably want to delete the data for security reasons after you\'re done using the app. Erase local data?';

        this._ui.confirm(confirmation)
            .then(async (res) => {
                // Erase local app data (the App DB)
                if (!this._app.db) {
                    return this._onLocalDataCleared();
                }

                await this._app.db.wipe();

                return this._onLocalDataCleared();
                // TODO: Now I need access to app.db / db directly. Doesn't sound like a good thing to inject it here. Can we make a global window.app in App.init() (window.app = this)? Is it a good idea?
            })
            .catch(err => {
                console.log(err);
                // Do nothing
            });
    }

    _onLocalDataCleared() {
        this._ui.notify('Local data has been cleared!', 'success');
    }
}

export default OsOverlay;