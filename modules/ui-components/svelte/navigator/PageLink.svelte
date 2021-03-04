<script>
    import Navigator from '../../../Navigator.js';

    export let to;
    export let params = {};

    function navigate() {
        Navigator.goTo(to, params);
    }
</script>

<tamplate on:click|preventDefault={() => navigate()}>
    <slot></slot>
</tamplate>