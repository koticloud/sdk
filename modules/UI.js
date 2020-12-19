import Panel from './ui-components/Panel.js';
import OsOverlay from './ui-components/OsOverlay.js';

import HasEvents from '../traits/HasEvents';

class UI {
    constructor(app) {
        this._app = app;

        this._openDialogsCount = 0;
        this.overlayEl = null;
        this.notificationsContainerEl = null;

        this._components = [
            new Panel(this),
            new OsOverlay(this),
        ];

        this._initialize();
    }

    _initialize() {
        const body = document.querySelector('body');

        // Prevent multiple initialization (this class is only appended after
        // an initialization)
        if (body.classList.contains('koti-cloud-sdk-ui')) {
            // Get the existing elements
            this.overlayEl = document.querySelector('.koti-cloud-sdk-ui--overlay');
            this.notificationsContainerEl = document.querySelector('.koti-cloud-sdk-ui--notifications-container');

            return;
        }

        for (let component of this._components) {
            if (!component.isInitialized()) {
                component.initialize();
            }
        }

        this.overlayEl = document.createElement('div');
        this.overlayEl.classList.add('koti-cloud-sdk-ui--overlay');

        this.notificationsContainerEl = document.createElement('div');
        this.notificationsContainerEl.classList.add('koti-cloud-sdk-ui--notifications-container');

        body.appendChild(this.overlayEl);
        body.appendChild(this.notificationsContainerEl);

        // Close notifications on click
        this.notificationsContainerEl.addEventListener('click', (e) => {
            if (e.target.classList.contains('koti-cloud-sdk-ui--notification')) {
                this._closeNotification(e.target);
            }
        });

        // This will tell us the the UI component has been initialized
        body.classList.add('koti-cloud-sdk-ui');
    }

    getApp() {
        return this._app;
    }

    _showOverlay() {
        this.overlayEl.classList.add('show');
    }
    
    _hideOverlay() {
        this.overlayEl.classList.remove('show');
    }

    /**
     * Show a confirmation dialog.
     * 
     * @param {string} msg
     * @param {string} id
     */
    confirm(msg, id = null) {
        // Dialog container
        const dialogEl = document.createElement('div');
        dialogEl.classList.add('koti-cloud-sdk-ui--dialog');

        // If an id was specified
        if (id) {
            // If dialog with this id already exists - don't create a new one
            if (document.querySelector(`.koti-cloud-sdk-ui--dialog[data-id="${id}"]`)) {
                return new Promise((resolve, reject) => {
                    reject();
                });
            }

            dialogEl.dataset.id = id;
        }

        // Dialog body container
        const bodyEl = document.createElement('div');
        bodyEl.classList.add('koti-cloud-sdk-ui--dialog--body');
        bodyEl.innerText = msg;

        // Dialog buttons container
        const buttonsEl = document.createElement('div');
        buttonsEl.classList.add('koti-cloud-sdk-ui--dialog--buttons');

        // Dialog buttons
        const btnYes = document.createElement('button');
        btnYes.classList.add('koti-cloud-sdk-ui--dialog--button');
        btnYes.innerText = 'Yes';

        const btnNo = document.createElement('button');
        btnNo.classList.add('koti-cloud-sdk-ui--dialog--button');
        btnNo.innerText = 'No';

        // Append elements
        buttonsEl.appendChild(btnYes);
        buttonsEl.appendChild(btnNo);

        dialogEl.appendChild(bodyEl);
        dialogEl.appendChild(buttonsEl);

        this.overlayEl.appendChild(dialogEl);

        // Show the overlay with all the elements
        this._showOverlay();

        this._openDialogsCount++;

        // Return a promise
        return new Promise((resolve, reject) => {
            btnYes.addEventListener('click', (e) => {
                // Destroy the dialog
                dialogEl.remove();
                this._openDialogsCount--;

                // Hide the overlay if there are no more open dialogs left
                if (!this._openDialogsCount) {
                    this._hideOverlay();
                }

                resolve();
            }, { once: true });

            btnNo.addEventListener('click', (e) => {
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

    /**
     * Show a select dialog.
     * 
     * @param {Array} options 
     * @param {string} id
     */
    select(options, id = null) {
        // If dialog with the specified id already exists - don't create a new
        // one
        if (id && document.querySelector(`.koti-cloud-sdk-ui--dialog[data-id="${id}"]`)) {
            return new Promise((resolve, reject) => {
                reject();
            });
        }

        const title = options.title ? options.title : 'Select Option';
        const selected = options.selected ? options.selected : null;
        options = options.options;

        // Dialog container
        const dialogEl = document.createElement('div');
        dialogEl.classList.add('koti-cloud-sdk-ui--dialog');

        // If an id was specified
        if (id) {
            dialogEl.dataset.id = id;
        }

        // Dialog title
        let titleEl = null;

        if (title) {
            titleEl = document.createElement('div');
            titleEl.classList.add('koti-cloud-sdk-ui--dialog--title');
            titleEl.innerText = title;
        }

        // Dialog body container
        const bodyEl = document.createElement('div');
        bodyEl.classList.add('koti-cloud-sdk-ui--dialog--body');

        const list = document.createElement('ul');
        list.classList.add('koti-cloud-sdk-ui--dialog--select-list');

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
        buttonsEl.classList.add('koti-cloud-sdk-ui--dialog--buttons');

        // Dialog buttons
        const btnCancel = document.createElement('button');
        btnCancel.classList.add('koti-cloud-sdk-ui--dialog--button');
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
        notification.classList.add('koti-cloud-sdk-ui--notification');
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

    openDialogsCount() {
        return this._openDialogsCount;
    }

    hasOpenDialogs() {
        return this._openDialogsCount > 0;
    }

    overlayVisible() {
        return this.overlayEl.classList.contains('show');
    }
}

/**
 * Traits
 */
Object.assign(UI.prototype, HasEvents);

export default UI;