<script>
    export let text = '';
    export let disabled = false;
    export let useAccentColors = false;
</script>

<style lang="scss">
.kc-component--btn {
    display: inline-block;
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

    &.disabled {
        pointer-events: none;
        color: var(--kc-color--text-pale);
    }

    &.accent {
        background: var(--kc-color--bg-accent);
        color: var(--kc-color--text-accent);

        &:hover {
            color: var(--kc-color--text-accent-pale);
        }

        &:active {
            background: var(--kc-color--bg-secondary);
            color: var(--kc-color--text-secondary);
        }
    }
}
</style>

<slot>
    <button class="kc-component--btn kc--btn-reset"
        class:accent={useAccentColors}
        class:disabled={disabled}
        on:click
    >
        { text }
    </button>
</slot>