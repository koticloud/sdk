<script>
    import { showSidebar } from './showSidebar.js';

    function toggleSidebar() {
        showSidebar.set(! $showSidebar);
    }
</script>

<style lang="scss">
$bigScreenWidth: 1150px;

.toggle-btn {
    display: block;

    @media (min-width: $bigScreenWidth) {
        display: none;
    }
}
</style>

<div class="toggle-btn" on:click|preventDefault={() => toggleSidebar()}>
    <slot>Toggle Sidebar</slot>
</div>