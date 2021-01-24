import Navigator from '../../../Navigator.js';

class PageLink extends HTMLElement
{
    constructor() {
        // If you define a constructor, always call super() first!
        // This is specific to CE and required by the spec.
        super();

        this.firstElementChild.addEventListener('click', () => {
            const to = this.getAttribute('to');
            let params = this.getAttribute('params');
            let options = {
                beforeNavigation: () => true,
            };

            if (params) {
                eval(`params = ${params};`);
            } else {
                params = {};
            }

            if (this.getAttribute('beforeNavigation')) {
                let func = this.getAttribute('beforeNavigation');
                
                if (func) {
                    eval(`options['beforeNavigation'] = ${func};`);
                }
            }

            Navigator.goTo(to, params, options);
        });
    }
}

export default PageLink;