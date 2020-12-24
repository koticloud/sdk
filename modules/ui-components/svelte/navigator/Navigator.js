import { get } from 'svelte/store';

import App from '../../../App.js';
import { Pages } from './Pages.js';
import { CurrentPage } from './CurrentPage.js';

class Navigator {
    static init() {
        if (this._initialized) {
            return;
        }

        window.addEventListener('popstate', (event) => {
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

    static goTo(name) {
        const page = get(Pages)[name];

        if (!page) {
            throw `Navigator: Page with name "${name}" doesn\'t exist!`;
        }

        CurrentPage.set(page);

        App.setTitle(page.title);

        history.pushState({}, '', `#${name}`)
    }

    static goBack() {
        this.goTo(get(CurrentPage).parent.name);
    }

    static _onBackButton(event) {
        // If the current page has a parent page - go one level up
        if (get(CurrentPage).parent) {
            this.goBack();
        }
    }
}

export default Navigator;