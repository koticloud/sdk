<script>
    import Navigator from '../../../Navigator.js';

    let currentPage;

    Navigator.on('current-page-updated', function (page) {
        currentPage = page;
    });
</script>

{#if currentPage}
    <svelte:component this={currentPage.component} />
{/if}