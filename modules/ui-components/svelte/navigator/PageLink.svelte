<script>
    import Navigator from '../../../Navigator.js';

    export let to;
    export let params = {};
    export let beforeNavigation = () => true;

    function navigate() {
        const options = {
            beforeNavigation: beforeNavigation,
        };

        Navigator.goTo(to, params, options);
    }
</script>

<div on:click|preventDefault={() => navigate()}>
    <slot></slot>
</div>