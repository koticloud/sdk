import App from './App.js';

class Navigator
{
    static _onBeforeEnteringEach = [];
    static _onAfterEnteringEach = [];
    static _onBeforeLeavingEach = [];
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
            canLeave = await this.onBeforeLeaving(Navigator.currentPage);

            // A global beforeLeaving check
            canLeave = canLeave && (await this.onBeforeLeavingEach(
                Navigator.currentPage,
                Navigator.currentPage.parent
            ));

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

    static async goTo(page, params = {}, withBeforeLeavingCheck = true) {
        let name = page;

        if (typeof page === 'string') {
            page = Navigator.pages[name];
        } else {
            name = page.name;
        }

        if (!page) {
            throw `Navigator: Page with name "${name}" doesn\'t exist!`;
        }

        // Don't navigate when there are any dialogs open
        if (App._instance && App._instance.ui.hasOpenDialogs()) {
            return false;
        }

        // Combine default page params with the current params
        if (page.params && params) {
            params = Object.assign({}, page.params, params);
        }

        // Create a clone of the page object to keep the original object intact
        const toPage = Object.assign({}, page, { params });

        if (withBeforeLeavingCheck) {
            let canLeave = true;
            
            if (Navigator.currentPage) {
                // A beforeLeaving check for the current page
                canLeave = await this.onBeforeLeaving(Navigator.currentPage);

                // A global beforeLeaving check
                canLeave = canLeave
                    && (await this.onBeforeLeavingEach(Navigator.currentPage, toPage));

                if (!canLeave) {
                    return false;
                }
            }
        }

        // A beforeEntering check for the new page
        let canEnter = true;

        canEnter = await this.onBeforeEntering(toPage);

        // A global beforeEntering check
        canEnter = canEnter
            && (await this.onBeforeEnteringEach(Navigator.currentPage, toPage));

        if (!canEnter) {
            return false;
        }

        // Navigate to the new page
        const prevPage = Object.assign({}, Navigator.currentPage);
        Navigator.currentPage = toPage;

        App.setTitle(toPage.title);

        history.pushState({}, '', `#/${name}`);

        // Save the current page state for back navigation (here we modify the
        // original page object)
        page.lastState = Object.assign({}, Navigator.currentPage);
        // console.log(page.lastState);
        // console.log(page.lastState.params);

        // If this is not a root level page
        if (page.parent) {
            Navigator._closeAppOnBackNavigation = false;
        }

        // A afterEntering callback for the new page
        this.onAfterEntering(Navigator.currentPage);

        // A global afterEntering callback
        this.onAfterEnteringEach(prevPage, Navigator.currentPage);
    }

    static goBack(withBeforeLeavingCheck = true) {
        let page = Navigator.currentPage.parent;

        if (!page) {
            return;
        }

        // If the parent page has a saved state from previous navigation then
        // restore that state. Otherwise just open the parent page.
        this.goTo(page.lastState ? page.lastState : page, {}, withBeforeLeavingCheck);
    }

    static _onBackButton(event) {
        // If the current page has a parent page - go one level up
        if (Navigator.currentPage.parent) {
            this.goBack(false);
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
     * Attach a beforeEntering callback to the current page
     * 
     * @param {function} callback 
     */
    static beforeEntering(callback) {
        const pages = Navigator.pages;

        pages[Navigator.currentPage.name].beforeEntering = callback;
        Navigator.currentPage.beforeEntering = callback;
    }

    static async onBeforeEntering(page) {
        const beforeEntering = page.beforeEntering;

        if (beforeEntering) {
            if (beforeEntering.constructor.name === 'AsyncFunction') {
                return await beforeEntering(Navigator.currentPage, page);
            } else {
                return beforeEntering(Navigator.currentPage, page);
            }
        }

        return true;
    }

    /**
     * Attach a afterEntering callback to the current page
     * 
     * @param {function} callback 
     */
    static afterEntering(callback) {
        const pages = Navigator.pages;

        pages[Navigator.currentPage.name].afterEntering = callback;
        Navigator.currentPage.afterEntering = callback;
    }

    static onAfterEntering(page) {
        const afterEntering = page.afterEntering;

        if (afterEntering) {
            afterEntering(Navigator.currentPage, page);
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

    static async onBeforeLeaving(page) {
        const beforeLeaving = page.beforeLeaving;

        if (beforeLeaving) {
            if (beforeLeaving.constructor.name === 'AsyncFunction') {
                return await beforeLeaving(Navigator.currentPage, page);
            } else {
                return beforeLeaving(Navigator.currentPage, page);
            }
        }

        return true;
    }

    /**
     * Set a beforeEnteringEach (global) callback
     * 
     * @param {function} callback 
     */
    static beforeEnteringEach(callback) {
        Navigator._onBeforeEnteringEach.push(callback);
    }

    static async onBeforeEnteringEach(from, to) {
        let canEnter = true;

        for (let callback of Navigator._onBeforeEnteringEach) {
            if (callback.constructor.name === 'AsyncFunction') {
                canEnter = canEnter && (await callback(from, to));
            } else {
                canEnter = canEnter && callback(from, to);
            }
        }

        return canEnter;
    }

    /**
     * Set a afterEnteringEach (global) callback
     * 
     * @param {function} callback 
     */
    static afterEnteringEach(callback) {
        Navigator._onAfterEnteringEach.push(callback);
    }

    static onAfterEnteringEach(from, to) {
        Navigator._onAfterEnteringEach.forEach(callback => {
            callback(from, to);
        });
    }

    /**
     * Set a beforeLeavingEach (global) callback
     * 
     * @param {function} callback 
     */
    static beforeLeavingEach(callback) {
        Navigator._onBeforeLeavingEach.push(callback);
    }

    static async onBeforeLeavingEach(from, to) {
        let canLeave = true;

        for (let callback of Navigator._onBeforeLeavingEach) {
            if (callback.constructor.name === 'AsyncFunction') {
                canLeave = canLeave && (await callback(from, to));
            } else {
                canLeave = canLeave && callback(from, to);
            }
        }

        return canLeave;
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