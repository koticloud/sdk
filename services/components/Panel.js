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
            <a href="#" class="koti-cloud-sdk-ui--panel--btn-link koti-cloud-sdk-ui--panel--btn-koti-cloud">Koti Cloud</a>
        `;
    }

    /**
     * Register the component events
     * 
     * @return void
     */
    _registerEvents() {
        document.querySelector('.koti-cloud-sdk-ui--panel--btn-koti-cloud')
            .addEventListener('click', (e) => {
                e.preventDefault();

                this._ui.emit('toggle-os-overlay');
            });
    }
}

export default Panel;