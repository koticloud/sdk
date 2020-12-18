class Component
{
    constructor(ui) {
        this._ui = ui;
        this._body = document.querySelector('body');
        this._el = null;
    }

    /**
     * Get the component's main element class name
     * 
     * @return string
     */
    _getClass() {
        throw 'Method _getClass() is not implemented.';
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
     * Initialize the component
     * 
     * @return void
     */
    initialize() {
        const body = document.querySelector('body');

        this._el = document.createElement('div');
        this._el.classList.add(this._getClass());
        this._el.innerHTML = this._getHtml();

        body.appendChild(this._el);

        this._registerEvents();
    }

    /**
     * Register the component events
     * 
     * @return void
     */
    _registerEvents() {
        //
    }

    /**
     * Determine whether the component is initialized yet
     * 
     * @return boolean
     */
    isInitialized() {
        return document.querySelectorAll(this._getClass()).length > 0;
    }
}

export default Component;