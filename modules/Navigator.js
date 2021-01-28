import App from './App.js';

class Navigator
{
    static _onAfterNavigation;
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
                if (beforeLeaving.constructor.name === 'AsyncFunction') {
                    canLeave = await beforeLeaving();
                } else {
                    canLeave = beforeLeaving();
                }
            }

            if (!canLeave) {
                Navigator._goingForward = true;

                event.preventDefault();
                // Will trigger popstate again, which is ignored by setting
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

    static async goTo(page, params = {}, options = {}) {
        let name = page;

        if (typeof page === 'string') {
            page = Navigator.pages[name];
        } else {
            name = page.name;
        }

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

        // Combine default page params with the current params
        if (page.params && params) {
            params = Object.assign(page.params, params);
        }

        Navigator.currentPage = Object.assign({}, page, { params });
        Navigator.emit('current-page-updated', Navigator.currentPage);

        App.setTitle(page.title);

        history.pushState({}, '', `#/${name}`);

        // Save the current page state for back navigation
        page.lastState = Object.assign({}, Navigator.currentPage);

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
        let page = Navigator.currentPage.parent;

        if (!page) {
            return;
        }

        // If the parent page has a saved state from previous navigation then
        // restore that state. Otherwise just open the parent page.
        this.goTo(page.lastState ? page.lastState : page);
    }

    static _onBackButton(event) {
        // If the current page has a parent page - go one level up
        if (Navigator.currentPage.parent) {
            this.goBack();
        } else {
            // In browsers, calling history back goes to the previous page (the
            // page that was open before the app)
            // On mobiles, when installed as an app - the app closes, but only
            // after the second back button press. Can't solve this problem, so
            // let's just show a notification that the back button needs to be
            // pressed twice.
            if (!Navigator._closeAppOnBackNavigation) {
                Navigator._closeAppOnBackNavigation = true;

                if (App._instance) {
                    App._instance.ui.notify('Press back button again to close the app');
                }
            }

            history.back();
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