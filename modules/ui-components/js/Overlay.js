import Component from './Component.js';

class Overlay extends Component
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
        return 'kc--overlay';
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
        return '';
    }

    /**
     * Register the component events
     * 
     * @return void
     */
    _registerEvents() {
        // Close overlay on overlay click
        this._el.addEventListener('click', (e) => {
            // Only when click on the overlay element directly
            if (e.target === this._el) {
                this._ui.emit('overlay-closed');
    
                this.removeChildren();
    
                this.hide();
            }
        });
    }

    show() {
        if (!this._el.classList.contains('kc--overlay--show')) {
            this._el.classList.add('kc--overlay--show');
        }
    }

    hide() {
        this._el.classList.remove('kc--overlay--show');
    }

    appendChild(child) {
        this._el.appendChild(child);
    }

    hasChild(selector) {
        return document.querySelectorAll(selector).length > 0;
    }

    removeChildren() {
        for (let child of this._el.children) {
            this._el.removeChild(child);
        }
    }
}

export default Overlay;