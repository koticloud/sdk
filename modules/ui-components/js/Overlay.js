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
            // Only when clicking on the overlay element directly
            if (e.target === this._el) {
                this.removeLastChild();
                
                if (this._el.children.length === 0) {
                    this._ui.emit('overlay-closed');

                    this.hide();
                }
            }
        });
    }

    isVisibile() {
        return this._el.classList.contains('kc--overlay--show');
    }

    show() {
        if (!this.isVisibile()) {
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

    removeChild(selector) {
        const el = document.querySelector(selector);
        
        if (el) {
            el.remove();
        }
    }

    removeLastChild() {
        if (this._el.children.length === 0) {
            return;
        }

        this._el.removeChild(this._el.lastChild);
    }

    resetScroll() {
        this._el.scrollTo(0, 0);
    }
}

export default Overlay;