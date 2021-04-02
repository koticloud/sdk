<script>
    import Navigator from '../../../Navigator.js';

    export let to;
    export let params = {};

    function navigate() {
        Navigator.goTo(to, params);
    }
</script>

<style lang="scss">
.page-link-btn {
    display: inline-block;
}
</style>

<div class="page-link-btn" on:click|preventDefault={() => navigate()}>
    <slot></slot>
</div>