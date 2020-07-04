class UI {
    constructor() {
        this._initialize();

        this.openDialogsCount = 0;
    }

    _initialize() {
        const body = document.querySelector('body');

        this.overlayEl = document.createElement('div');
        this.overlayEl.classList.add('koti-cloud-sdk-ui--overlay');
        body.appendChild(this.overlayEl);
    }

    _showOverlay() {
        this.overlayEl.classList.add('show');
    }
    
    _hideOverlay() {
        this.overlayEl.classList.remove('show');
    }

    confirm(msg, id = null) {
        // Dialog container
        const dialogEl = document.createElement('div');
        dialogEl.classList.add('koti-cloud-sdk-ui--dialog');

        // If an id was specified
        if (id) {
            // If dialog with this id already exists - don't create a new one
            if (document.querySelector(`.koti-cloud-sdk-ui--dialog[data-id="${id}"]`)) {
                return;
            }

            dialogEl.dataset.id = id;
        }

        // Dialog message container
        const messageEl = document.createElement('div');
        messageEl.classList.add('koti-cloud-sdk-ui--dialog--message');
        messageEl.innerText = msg;

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

        dialogEl.appendChild(messageEl);
        dialogEl.appendChild(buttonsEl);

        this.overlayEl.appendChild(dialogEl);

        // Show the overlay with all the elements
        this._showOverlay();

        this.openDialogsCount++;

        // Return a promise
        return new Promise((resolve, reject) => {
            btnYes.addEventListener('click', (e) => {
                // Destroy the dialog
                dialogEl.remove();
                this.openDialogsCount--;

                // Hide the overlay if there are no more open dialogs left
                if (!this.openDialogsCount) {
                    this._hideOverlay();
                }

                resolve();
            }, { once: true });

            btnNo.addEventListener('click', (e) => {
                // Destroy the dialog
                dialogEl.remove();
                this.openDialogsCount--;

                // Hide the overlay if there are no more open dialogs left
                if (!this.openDialogsCount) {
                    this._hideOverlay();
                }

                reject();
            }, { once: false });
        });
    }
}

export default UI;