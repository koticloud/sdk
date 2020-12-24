<script>
    import Navigator from './navigator/Navigator.js';

    export let to;

    function navigate() {
        Navigator.goTo(to);
    }
</script>

<div on:click|preventDefault={() => navigate()}>
    <slot></slot>
</div>