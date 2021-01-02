import { get } from 'svelte/store';

import App from '../../../App.js';
// Svelte stores
import { Pages } from './Pages.js';
import { CurrentPage } from './CurrentPage.js';

class Navigator {
    static _onAfterNavigation = {};
    static _goingForward = false;
    static _closeAppOnBackNavigation = false;

    static init() {
        if (this._initialized) {
            return;
        }

        window.addEventListener('popstate', async (event) => {
            // Ignore `history.go(1)`
            if (Navigator._goingForward) {
                Navigator._goingForward = false;

                return;
            }

            const beforeLeaving = get(CurrentPage).beforeLeaving;

            if (beforeLeaving) {
                if ((beforeLeaving.constructor.name === 'AsyncFunction' && !await beforeLeaving()) || !beforeLeaving()) {
                    Navigator._goingForward = true;

                    event.preventDefault();
                    // Will trigger popstate again, which is ignore by setting
                    // Navigator._goingForward to `true`
                    history.go(1);

                    return;
                }
            }

            this._onBackButton(event);
        });

        this._initialized = true;
    }

    static setPages(pages) {
        Pages.set(this._parsePages(pages));

        this.init();
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
        return get(CurrentPage);
    }

    static async goTo(name, params = {}) {
        const page = get(Pages)[name];

        if (!page) {
            throw `Navigator: Page with name "${name}" doesn\'t exist!`;
        }

        CurrentPage.set(Object.assign({}, page, { params }));

        App.setTitle(page.title);

        history.pushState({}, '', `#${name}`);

        // If this is not a root level page
        if (page.parent) {
            Navigator._closeAppOnBackNavigation = false;
        }

        if (Navigator._onAfterNavigation) {
            Navigator._onAfterNavigation();
        }
    }

    static goBack() {
        this.goTo(get(CurrentPage).parent.name);
    }

    static _onBackButton(event) {
        // If the current page has a parent page - go one level up
        if (get(CurrentPage).parent) {
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
        const pages = get(Pages);

        pages[get(CurrentPage).name].beforeLeaving = callback;
        get(CurrentPage).beforeLeaving = callback;
    }

    /**
     * Add a global afterNavigation callback
     * 
     * @param {function} callback 
     */
    static afterNavigation(callback) {
        Navigator._onAfterNavigation = callback;
    }
}

export default Navigator;