<script>
    import { showSidebar } from './showSidebar.js';

    function toggleSidebar() {
        showSidebar.set(! $showSidebar);
    }
</script>

<style lang="scss">
$bigScreenWidth: 1150px;

.toggle-btn {
    display: inline-block;
    position: relative;
    cursor: pointer;
    height: 2rem;
    width: 2rem;
    text-align: center;

    svg {
        fill: var(--kc-color--text-pale);
        width: 50%;
        height: 50%;
        margin-top: 25%;
    }

    @media (min-width: $bigScreenWidth) {
        display: none;
    }
}
</style>

<div class="toggle-btn" on:click|preventDefault={() => toggleSidebar()}>
    <slot>
        <svg viewBox="0 0 100 80" width="40" height="40">
            <rect width="100" height="12" rx="8"></rect>
            <rect y="32.5" width="100" height="12" rx="8"></rect>
            <rect y="65" width="100" height="12" rx="8"></rect>
        </svg>
    </slot>
</div>