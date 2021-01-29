<script>
    import Navigator from '../../../Navigator.js';

    let currentPage;

    Navigator.afterEnteringEach((from, to) => {
        currentPage = to;
    });
</script>

{#if currentPage}
    <svelte:component this={currentPage.component} />
{/if}