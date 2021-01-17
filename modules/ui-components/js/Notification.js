import Component from './Component.js';

class Notification extends Component
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
        return 'kc--notifications-container';
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
        // Close notifications on click
        this._el.addEventListener('click', (e) => {
            if (e.target.classList.contains('kc--notification')) {
                this.close(e.target);
            }
        });
    }

    add(text, type) {
        const notification = document.createElement('div');
        notification.classList.add('kc--notification');
        notification.classList.add(type);
        notification.innerText = text;

        this._el.appendChild(notification);

        // Close notification automatically after a few seconds
        setTimeout(() => {
            this.close(notification);
        }, 5000);

        return notification;
    }

    close(notificationEl) {
        if (!notificationEl || !notificationEl.parentElement) {
            return;
        }

        notificationEl.parentElement.removeChild(notificationEl);
    }
}

export default Notification;