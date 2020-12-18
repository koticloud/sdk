import Component from './Component.js';

class Panel extends Component
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
        return 'koti-cloud-sdk-ui--panel';
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
        this._registerActionEvents();
    }

    /**
     * Get the component's inner HTML
     * 
     * @return string
     */
    _getTemplate() {
        return `
            <div class="koti-cloud-sdk-ui--panel--actions">
                <a href="#" class="koti-cloud-sdk-ui--panel--btn-link koti-cloud-sdk-ui--panel--actions--clear-local-data">Clear Local Data</a>
            </div>
        `;
    }

    /**
     * Register the component events
     * 
     * @return void
     */
    _registerEvents() {
        // Toggle panel visibility on mouse at the left corner
        this._body.addEventListener('mouseleave', (e) => {
            if (e.clientY <= 1 && e.clientX < 10) {
                this._togglePanel();
            }
        });

        // Close panel on overlay click
        this._el.addEventListener('click', (e) => {
            if (e.target.classList.contains('koti-cloud-sdk-ui--panel')) {
                this._togglePanel(e.target);
            }
        });

        this._body.addEventListener('touchstart', (e) => {
            this._touchFromY = e.changedTouches[0].pageY;
        });

        this._body.addEventListener('touchend', (e) => {
            this._touchToY = e.changedTouches[0].pageY;

            const delta = this._touchToY - this._touchFromY;

            if (this._touchFromY && this._touchFromY <= 10 && delta >= 50) {
                this._togglePanel();
            }

            this._touchFromY = null;
            this._touchToY = null;
        });
    }

    _togglePanel() {
        this._el.classList.toggle('koti-cloud-sdk-ui--panel--show');
    }

    /**
     * Register the component events
     * 
     * @return void
     */
    _registerActionEvents() {
        document.querySelector('.koti-cloud-sdk-ui--panel--actions--clear-local-data')
            .addEventListener('click', (e) => {
                e.preventDefault();

                this._clearLocalData();
            })
    }

    _clearLocalData() {
        this._ui.confirm('All your app data is stored and kept locally after you\'ve used the app. For security reasons you should delete your local data every time after using an app, unless you are using the app on a trusted (your own) device and not switching between Koti Cloud accounts. Ultimately your data is safely stored on our servers and won\'t be lost. Erase local data?')
            .then(res => {
                // Erase local app data (the App DB)
                // TODO: Now I need access to app.db / db directly. Doesn't sound like a good thing to inject it here. Can we make a global window.app in App.init() (window.app = this)? Is it a good idea?
            })
            .catch(res => {
                // Do nothing
            });
    }
}

export default Panel;