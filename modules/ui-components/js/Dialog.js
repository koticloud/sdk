import Component from './Component.js';

class Dialog extends Component
{
    constructor(ui, overlay) {
        super(ui);
        this._overlay = overlay;

        this._initialized = false;
        this._openDialogsCount = 0;
    }

    /**
     * Get the component's main element class name
     * 
     * @return string
     */
    _getClass() {
        return '';
    }

    /**
     * Initialize the component
     * 
     * @return void
     */
    initialize() {
        this._initialized = true;
    }

    /**
     * Determine whether the component is initialized yet
     * 
     * @return boolean
     */
    isInitialized() {
        return this._initialized;
    }

    /**
     * Register the component events
     * 
     * @return void
     */
    _registerEvents() {
        // // Toggle overlay on UI toggle-os-overlay event
        // this._ui.on('show-overlay', () => {
        //     this._showSelf();
        // });

        // this._ui.on('hide-overlay', () => {
        //     this._hideSelf();
        // });
    }

    /**
     * Make a new dialog object
     * 
     * @param {string} id 
     * @param {mixed} body 
     * @param {object} buttons 
     */
    _makeDialog(id = null, body, buttons = null) {
        // Dialog container
        const dialogEl = document.createElement('div');
        dialogEl.classList.add('kc--dialog');

        if (id) {
            dialogEl.dataset.id = id;
        }

        // Dialog body container
        const bodyEl = document.createElement('div');
        bodyEl.classList.add('kc--dialog--body');

        if (body) {            
            if (typeof body === 'string') {
                bodyEl.innerHTML = body;
            } else {
                bodyEl.appendChild(body);
            }
        }

        // Append body to the dialog
        dialogEl.appendChild(bodyEl);

        // If the dialog has buttons
        if (buttons) {
            // Dialog buttons container
            const buttonsEl = document.createElement('div');
            buttonsEl.classList.add('kc--dialog--buttons');

            // Dialog buttons
            for (let name in buttons) {
                const btn = buttons[name];

                const btnEl = document.createElement('button');
                btnEl.classList.add('kc--dialog--button');
                btnEl.classList.add(name);
                btnEl.innerText = btn.text;

                // Append button
                buttonsEl.appendChild(btnEl);
            }

            // Append buttons container to the dialog
            dialogEl.appendChild(buttonsEl);
        }

        return {
            el: dialogEl,
            buttons: buttons,
        }
    }

    /**
     * Append a dialog to the overlay and "run" it
     * 
     * @param {object} dialog 
     */
    _runDialog(dialog) {
        // If an id was specified
        if (dialog.el.dataset.id) {
            const id = dialog.el.dataset.id;
        
            // If dialog with this id already exists - don't append a new one
            if (this._overlay.hasChild(`.kc--dialog[data-id="${id}"]`)) {
                return new Promise((resolve, reject) => {
                    reject();
                });
            }
        }

        // Append the dialog to the overlay
        this._overlay.appendChild(dialog.el);
        this._openDialogsCount++;

        // Show the overlay with all the elements (if it is not shown yet)
        this._overlay.show();

        // Return a promise
        return new Promise((resolve, reject) => {
            for (let name in dialog.buttons) {
                const btn = dialog.buttons[name];
                const btnEl = dialog.el.querySelector(`.${name}`);

                btnEl.addEventListener('click', (e) => {
                    if (btn.closeDialog !== false) {
                        // Destroy the dialog
                        dialog.el.remove();
                        this._openDialogsCount--;

                        // Hide the overlay if there are no more open dialogs left
                        if (!this._openDialogsCount) {
                            this._overlay.hide();
                        }
                    }
                    
                    // Custom handler
                    let res;

                    if (btn.handler) {
                        res = btn.handler(e);
                    }

                    if (btn.reject === true) {
                        reject(res);
                    } else {
                        resolve(res);
                    }
                }, { once: true });
            }
        });
    }

    /**
     * Show a (custom) dialog.
     * 
     * @param {string} body
     * @param {object} options
     */
    dialog(body, options) {
        const dialog = this._makeDialog(options.id, body, options.buttons);

        return this._runDialog(dialog);
    }

    /**
     * Show a confirmation dialog.
     * 
     * @param {string} msg
     * @param {string} id
     */
    confirm(msg, id = null) {
        return this.dialog(msg, {
            id: id,
            buttons: {
                btnYes: {
                    text: 'Yes',
                },
                btnNo: {
                    text: 'No',
                    reject: true,
                },
            }
        })
    }

    openDialogsCount() {
        return this._openDialogsCount;
    }
}

export default Dialog;