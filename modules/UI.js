import Panel from './ui-components/js/Panel.js';
import OsOverlay from './ui-components/js/OsOverlay.js';
import Overlay from './ui-components/js/Overlay.js';
import Dialog from './ui-components/js/Dialog.js';
import Notification from './ui-components/js/Notification.js';

import HasEvents from '../traits/HasEvents';

class UI {
    constructor(app) {
        this._app = app;

        const overlay = new Overlay(this);

        this._components = {
            panel: new Panel(this),
            osOverlay: new OsOverlay(this),
            overlay: overlay,
            dialog: new Dialog(this, overlay),
            notification: new Notification(this),
        };

        return this._initialize();
    }

    /**
     * Initialize the UI
     */
    _initialize() {
        // Initialize all the individual components
        for (let name in this._components) {
            const component = this._components[name];

            if (!component.isInitialized()) {
                component.initialize();
            }
        }

        // This will apply certain default styling to the app page and mark
        // that the UI is initialized
        document.querySelector('body').classList.add('kc');
    }

    /**
     * Get the related App instance
     */
    getApp() {
        return this._app;
    }

    /**
     * Show the overlay
     */
    showOverlay() {
        this._components.overlay.show();
    }

    /**
     * Hide the overlay
     */
    hideOverlay() {
        this._components.overlay.hide();
    }

    /**
     * Show an alert (message) dialog.
     * 
     * @param {string} msg
     * @param {string} id
     */
    alert(msg, id = null) {
        return this._components.dialog.alert(msg, id);
    }

    /**
     * Show a confirmation dialog.
     * 
     * @param {string} msg
     * @param {string} id
     */
    confirm(msg, id = null) {
        return this._components.dialog.confirm(msg, id);
    }

    /**
     * Show a custom dialog.
     * 
     * @param {object} options
     */
    dialog(options = {}) {
        return this._components.dialog.dialog(options);
    }

    /**
     * Show a select dialog.
     * 
     * @param {Array} options 
     */
    select(options) {
        return this._components.dialog.select(options);
    }

    notify(text, type = 'info') {
        return this._components.notification.add(text, type);
    }

    /**
     * Determine whether there are any open dialogs
     * 
     * @return boolean
     */
    hasOpenDialogs() {
        return this._components.dialog.openDialogsCount() > 0;
    }
}

/**
 * Traits
 */
Object.assign(UI.prototype, HasEvents);

export default UI;