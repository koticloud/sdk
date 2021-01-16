<script>
    import Navigator from '../../../Navigator.js';

    export let to;
    export let params = {};
    export let beforeNavigation = () => true;

    function navigate() {
        if (beforeNavigation() === true) {
            Navigator.goTo(to, params);
        }
    }
</script>

<div on:click|preventDefault={() => navigate()}>
    <slot></slot>
</div>