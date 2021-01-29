import Navigator from '../../../Navigator.js';

class PageRenderer extends HTMLElement
{
    constructor() {
        // If you define a constructor, always call super() first!
        // This is specific to CE and required by the spec.
        super();

        this.currentPage = Navigator.currentPage;

        Navigator.afterEnteringEach((from, to) => {
            this.currentPage = to;

            this.render();
        });
    }

    connectedCallback() {
        this.render();
    }

    /**
     * Render current page as the component's DOM
     */
    render() {
        this.innerHTML = this.currentPage.component;
    }
}

export default PageRenderer;