import Component from './Component.js';

class Panel extends Component
{
    constructor(ui) {
        super(ui);
    }

    /**
     * Get the component's main element class name
     * 
     * @return string
     */
    _getClass() {
        return 'kc--panel';
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

        this._body.prepend(this._el);

        this._registerEvents();
    }

    /**
     * Get the component's inner HTML
     * 
     * @return string
     */
    _getTemplate() {
        return `
            <div class="kc--panel--left">
                <button class="kc--panel--btn-link kc--panel--btn-koti-cloud">Koti Cloud</button>
            </div>

            <div class="kc--panel--right">
                <span class="kc--panel--app-title"></span>
            </div>
        `;
    }

    /**
     * Register the component events
     * 
     * @return void
     */
    _registerEvents() {
        document.querySelector('.kc--panel--btn-koti-cloud')
            .addEventListener('click', (e) => {
                e.preventDefault();

                this._ui.emit('toggle-os-overlay');
            });
    }
}

export default Panel;