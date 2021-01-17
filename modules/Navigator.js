import App from './App.js';

class Navigator
{
    static _onAfterNavigation = {};
    static _goingForward = false;
    static _closeAppOnBackNavigation = false;
    static _eventSubscriptions = {};

    static pages;
    static currentPage;

    static init() {
        if (this._initialized) {
            return;
        }

        window.addEventListener('popstate', async (event) => {
            // Ignore the `history.go(1)` from below
            if (Navigator._goingForward) {
                Navigator._goingForward = false;

                return;
            }

            let canLeave = true;

            // Global beforeLeaving checks
            // Prevent going back if any dialogs are open
            if (App._instance && App._instance.ui.hasOpenDialogs()) {
                canLeave = false;
            }

            // The current page's beforeLeaving callback/check
            const beforeLeaving = Navigator.currentPage.beforeLeaving;

            if (beforeLeaving) {
                if ((beforeLeaving.constructor.name === 'AsyncFunction' && !await beforeLeaving()) || !beforeLeaving()) {
                    canLeave = false;
                }
            }

            if (!canLeave) {
                Navigator._goingForward = true;

                event.preventDefault();
                // Will trigger popstate again, which is ignore by setting
                // Navigator._goingForward to `true`
                history.go(1);

                return;
            }

            this._onBackButton(event);
        });

        this._initialized = true;
    }

    static setPages(pages) {
        Navigator.pages = this._parsePages(pages);

        this.init();
        Navigator.emit('pages-updated', Navigator.pages);
    }

    static _parsePages(pages, parent = null) {
        let flat = {};

        for (let name in pages) {
            const page = pages[name];
            page.name = name;
            page.parent = parent;

            flat[name] = page;

            if (page.children) {
                flat = Object.assign(flat, this._parsePages(page.children, page));
            }

            delete page.children;
        }

        return flat;
    }

    static getCurrentPage() {
        return Navigator.currentPage;
    }

    static async goTo(name, params = {}, options = {}) {
        const page = Navigator.pages[name];

        if (!page) {
            throw `Navigator: Page with name "${name}" doesn\'t exist!`;
        }

        // Additional checks before navigation, per-goTo() basis/scope
        if (options.beforeNavigation) {
            if (options.beforeNavigation() !== true) {
                return false;
            }
        }

        // Don't navigate when there are any dialogs open
        if (App._instance && App._instance.ui.hasOpenDialogs()) {
            return false;
        }

        Navigator.currentPage = Object.assign({}, page, { params });
        Navigator.emit('current-page-updated', Navigator.currentPage);

        App.setTitle(page.title);

        history.pushState({}, '', `#/${name}`);

        // If this is not a root level page
        if (page.parent) {
            Navigator._closeAppOnBackNavigation = false;
        }

        // A global After Navigation callback
        if (Navigator._onAfterNavigation) {
            Navigator._onAfterNavigation();
        }
    }

    static goBack() {
        this.goTo(Navigator.currentPage.parent.name);
    }

    static _onBackButton(event) {
        // If the current page has a parent page - go one level up
        if (Navigator.currentPage.parent) {
            this.goBack();
        } else {
            // If there's no parent = we're at the root level -> close the app
            // on two back button presses in a row
            if (Navigator._closeAppOnBackNavigation) {
                window.close();
            } else {
                if (App._instance) {
                    App._instance.ui.notify('Press back button again to close the app');
                }

                Navigator._closeAppOnBackNavigation = true;
            }
        }
    }

    /**
     * Attach a beforeLeaving callback to the current page
     * 
     * @param {function} callback 
     */
    static beforeLeaving(callback) {
        const pages = Navigator.pages;

        pages[Navigator.currentPage.name].beforeLeaving = callback;
        Navigator.currentPage.beforeLeaving = callback;
    }

    /**
     * Add a global afterNavigation callback
     * 
     * @param {function} callback 
     */
    static afterNavigation(callback) {
        Navigator._onAfterNavigation = callback;
    }

    /**
     * Events
     */
    static emit(event, data) {
        if (!Navigator._eventSubscriptions[event]) {
            return;
        }

        for (let callback of Navigator._eventSubscriptions[event]) {
            callback(data);
        }
    }

    static on(event, callback) {
        if (Navigator._eventSubscriptions[event] === undefined) {
            Navigator._eventSubscriptions[event] = [];
        }

        Navigator._eventSubscriptions[event].push(callback);
    }
}

export default Navigator;