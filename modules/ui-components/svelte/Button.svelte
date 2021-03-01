<script>
    export let text = '';
</script>

<style lang="scss">
.kc-component--btn {
    background: var(--kc-color--bg-secondary);
    color: var(--kc-color--text-secondary);
    padding: .75rem 1.25rem;
    font-weight: 600;
    border-radius: .9rem;
    transition: background .15s ease;

    &:hover {
        background: var(--kc-color--bg-secondary-hover); 
    }

    &:active {
        background: var(--kc-color--bg-accent);
        color: var(--kc-color--text-accent);
    }
}
</style>

<slot>
    <button class="kc-component--btn kc--btn-reset" on:click>
        { text }
    </button>
</slot>