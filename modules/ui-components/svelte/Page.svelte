<script>
    import { CurrentPage } from './navigator/CurrentPage.js';
</script>

{#if $CurrentPage}
    <svelte:component this={$CurrentPage.component}/>
{/if}