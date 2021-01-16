import Panel from './ui-components/js/Panel.js';
import OsOverlay from './ui-components/js/OsOverlay.js';
import Overlay from './ui-components/js/Overlay.js';

import HasEvents from '../traits/HasEvents';
import Dialog from './ui-components/js/Dialog.js';

class UI {
    constructor(app) {
        this._app = app;

        this.overlayEl = null;  // TODO: Remove this var when not needed anymore
        this.notificationsContainerEl = null;

        const overlay = new Overlay(this);

        this._components = {
            panel: new Panel(this),
            osOverlay: new OsOverlay(this),
            overlay: overlay,
            dialog: new Dialog(this, overlay),
        };

        return this._initialize();
    }

    _initialize() {
        const body = document.querySelector('body');

        // Prevent multiple initialization (this class is only appended after
        // an initialization)
        if (body.classList.contains('kc')) {
            // Get the existing elements
            this.notificationsContainerEl = document.querySelector('.kc--notifications-container');

            return;
        }

        for (let name in this._components) {
            const component = this._components[name];

            if (!component.isInitialized()) {
                component.initialize();
            }
        }

        this.overlayEl = document.querySelector('.kc--overlay');

        this.notificationsContainerEl = document.createElement('div');
        this.notificationsContainerEl.classList.add('kc--notifications-container');

        body.appendChild(this.notificationsContainerEl);

        // Close notifications on click
        this.notificationsContainerEl.addEventListener('click', (e) => {
            if (e.target.classList.contains('kc--notification')) {
                this._closeNotification(e.target);
            }
        });

        // This will tell us the the UI component has been initialized
        body.classList.add('kc');
    }

    getApp() {
        return this._app;
    }

    showOverlay() {
        this.emit('show-overlay');
    }
    
    hideOverlay() {
        this.emit('hide-overlay');
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
     * @param {string} body
     * @param {object} options
     */
    dialog(body, options) {
        return this._components.dialog.dialog(body, options);
    }

    /**
     * Show a select dialog.
     * 
     * @param {Array} options 
     * @param {string} id
     */
    select(options, id = null) {
        // If dialog with the specified id already exists - don't create a new
        // one
        if (id && document.querySelector(`.kc--dialog[data-id="${id}"]`)) {
            return new Promise((resolve, reject) => {
                reject();
            });
        }

        const title = options.title ? options.title : 'Select Option';
        const selected = options.selected ? options.selected : null;
        options = options.options;

        // Dialog container
        const dialogEl = document.createElement('div');
        dialogEl.classList.add('kc--dialog');

        // If an id was specified
        if (id) {
            dialogEl.dataset.id = id;
        }

        // Dialog title
        let titleEl = null;

        if (title) {
            titleEl = document.createElement('div');
            titleEl.classList.add('kc--dialog--title');
            titleEl.innerText = title;
        }

        // Dialog body container
        const bodyEl = document.createElement('div');
        bodyEl.classList.add('kc--dialog--body');

        const list = document.createElement('ul');
        list.classList.add('kc--dialog--select-list');

        for (let value of Object.keys(options)) {
            const li = document.createElement('li');
            li.innerText = options[value];
            li.dataset.value = value;

            if (value == selected) {
                li.classList.add('active');
            }

            list.appendChild(li);
        }

        bodyEl.appendChild(list);

        // Dialog buttons container
        const buttonsEl = document.createElement('div');
        buttonsEl.classList.add('kc--dialog--buttons');

        // Dialog buttons
        const btnCancel = document.createElement('button');
        btnCancel.classList.add('kc--dialog--button');
        btnCancel.innerText = 'Cancel';

        buttonsEl.appendChild(btnCancel);

        // Append elements
        if (titleEl) {
            dialogEl.appendChild(titleEl);
        }
        dialogEl.appendChild(bodyEl);
        dialogEl.appendChild(buttonsEl);

        this.overlayEl.appendChild(dialogEl);

        // Show the overlay with all the elements
        this._showOverlay();

        this._openDialogsCount++;

        // Return a promise
        return new Promise((resolve, reject) => {
            list.addEventListener('click', (e) => {
                if (e.target.nodeName.toLowerCase() === 'li') {
                    const selectedValue = e.target.dataset.value;

                    // Destroy the dialog
                    dialogEl.remove();
                    this._openDialogsCount--;

                    // Hide the overlay if there are no more open dialogs left
                    if (!this._openDialogsCount) {
                        this._hideOverlay();
                    }

                    // Return the selected value
                    resolve(selectedValue);
                }
            }, { once: false });

            btnCancel.addEventListener('click', (e) => {
                // Destroy the dialog
                dialogEl.remove();
                this._openDialogsCount--;

                // Hide the overlay if there are no more open dialogs left
                if (!this._openDialogsCount) {
                    this._hideOverlay();
                }

                reject();
            }, { once: false });
        });
    }

    notify(text, type = 'info') {
        const notification = document.createElement('div');
        notification.classList.add('kc--notification');
        notification.classList.add(type);
        notification.innerText = text;

        this.notificationsContainerEl.appendChild(notification);

        // Close notification automatically after a few seconds
        setTimeout(() => {
            this._closeNotification(notification);
        }, 5000);
    }

    _closeNotification(el) {
        if (!el || !el.parentElement) {
            return;
        }

        el.parentElement.removeChild(el);
    }

    hasOpenDialogs() {
        return this._components.dialog.openDialogsCount() > 0;
    }
}

/**
 * Traits
 */
Object.assign(UI.prototype, HasEvents);

export default UI;