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
        //
    }

    /**
     * Make a new dialog object
     * 
     * @param {options} buttons 
     */
    _makeDialog(options) {
        // Dialog container
        const dialogEl = document.createElement('div');
        dialogEl.classList.add('kc--dialog');

        if (options.id) {
            dialogEl.dataset.id = options.id;
        }

        // Dialog title
        if (options.title) {
            const titleEl = document.createElement('div');
            titleEl.classList.add('kc--dialog--title');
            titleEl.innerText = options.title;

            // Append title to the dialog
            dialogEl.appendChild(titleEl);
        }

        // Dialog body
        if (options.body) {      
            const bodyEl = document.createElement('div');
            bodyEl.classList.add('kc--dialog--body');
      
            if (typeof options.body === 'string') {
                bodyEl.innerHTML = options.body;
            } else {
                bodyEl.appendChild(options.body);
            }

            // Append body to the dialog
            dialogEl.appendChild(bodyEl);
        }

        // Dialog buttons
        if (options.buttons) {
            // Dialog buttons container
            const buttonsEl = document.createElement('div');
            buttonsEl.classList.add('kc--dialog--buttons');

            // Dialog buttons
            for (let name in options.buttons) {
                const btn = options.buttons[name];

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
            buttons: options.buttons,
            promiseExtras: options.promiseExtras,
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
            // When the overlay containing the dialog is closed - reject
            const onOverlayClosed = this._ui.on('overlay-closed', () => {
                this._ui.off(onOverlayClosed);

                this._openDialogsCount--;

                reject();
            });

            // Button handlers
            for (let name in dialog.buttons) {
                const btn = dialog.buttons[name];
                const btnEl = dialog.el.querySelector(`.${name}`);

                btnEl.addEventListener('click', (e) => {
                    if (btn.closeDialog !== false) {
                        // Remove the dialog events
                        this._ui.off(onOverlayClosed);

                        // Destroy the dialog
                        dialog.el.remove();
                        this._openDialogsCount--;

                        // Hide the overlay if there are no more open dialogs left
                        if (!this._openDialogsCount) {
                            this._overlay.hide();
                        }
                    }
                    
                    let res;
                    
                    // Custom handler
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

            // Extras
            if (dialog.promiseExtras) {
                dialog.promiseExtras(dialog, resolve, reject, onOverlayClosed);
            }
        });
    }

    /**
     * Show a (custom) dialog.
     * 
     * @param {object} options
     */
    dialog(options = {}) {
        const dialog = this._makeDialog(options);

        return this._runDialog(dialog);
    }

    /**
     * Show an alert dialog.
     * 
     * @param {string} msg
     * @param {string} id
     */
    alert(msg, id) {
        return this.dialog({
            id: id,
            body: msg,
            buttons: {
                btnYes: {
                    text: 'Ok',
                },
            }
        });
    }

    /**
     * Show a confirmation dialog.
     * 
     * @param {string} msg
     * @param {string} id
     */
    confirm(msg, id = null) {
        return this.dialog({
            id: id,
            body: msg,
            buttons: {
                btnYes: {
                    text: 'Yes',
                },
                btnNo: {
                    text: 'No',
                    reject: true,
                },
            }
        });
    }

    /**
     * Show a select dialog.
     * 
     * @param {Array} options 
     */
    select(options) {
        let list = '';
        
        if (options.options) {
            const selected = options.selected ? options.selected : null;

            list = document.createElement('ul');
            list.classList.add('kc--dialog--select-list');

            for (let value of Object.keys(options.options)) {
                const li = document.createElement('li');
                li.innerText = options.options[value];
                li.dataset.value = value;

                if (value == selected) {
                    li.classList.add('active');
                }

                list.appendChild(li);
            }
        }

        return this.dialog({
            id: options.id,
            title: options.title ? options.title : 'Select Option',
            body: list,
            buttons: {
                btnCancel: {
                    text: 'Cancel',
                    reject: true,
                },
            },
            promiseExtras: (dialog, resolve, reject, onOverlayClosed) => {
                list.addEventListener('click', (e) => {
                    if (e.target.nodeName.toLowerCase() === 'li') {
                        const selectedValue = e.target.dataset.value;

                        // Remove the dialog events
                        this._ui.off(onOverlayClosed);

                        // Destroy the dialog
                        dialog.el.remove();
                        this._openDialogsCount--;

                        // Hide the overlay if there are no more open dialogs left
                        if (!this._openDialogsCount) {
                            this._overlay.hide();
                        }

                        // Return the selected value
                        resolve(selectedValue);
                    }
                }, { once: false });
            }
        });
    }

    openDialogsCount() {
        return this._openDialogsCount;
    }

    /**
     * Close a dialog by ID
     * 
     * @param {string} id 
     */
    close(id) {
        this._overlay.removeChild(`.kc--dialog[data-id="${id}"]`);
        
        this._openDialogsCount--;

        if (this._openDialogsCount == 0) {
            this._overlay.hide();
        }
    }

    /**
     * Close all open dialogs
     */
    closeAll() {
        this._overlay.removeChildren();
    }
}

export default Dialog;