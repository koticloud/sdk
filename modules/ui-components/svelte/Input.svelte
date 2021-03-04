<script>
    export let label = '';
    export let placeholder = '';
    export let options = {};
    export let value = null;
</script>

<style lang="scss">
.kc-component--input {
    background: var(--kc-color--bg-secondary);
    color: var(--kc-color--text-secondary);
    padding: .75rem 1.25rem;
    transition: background .15s ease;
    display: flex;
    align-items: center;

    &:hover {
        background: var(--kc-color--bg-secondary-hover);
    }

    .label {
        text-align: left;
        padding-right: 1rem;
    }

    .value {
        flex: 1;
    }

    .value input {
        width: 100%;
        font-family: inherit;
        color: var(--kc-color--text-main);
        margin: 0;
        padding: .5rem;

        background: var(--kc-color--bg-main);
        border: none;
        border: 1px solid var(--kc-color--bg-secondary);

        &:focus, &:active {
            border-color: var(--kc-color--bg-accent);
        }
    }
}
</style>

<slot>
    <div class="kc-component--input">
        <div class="label">{ label }</div>
        
        <div class="value">
            <input type="text"
                bind:value={value}
                placeholder={placeholder}>
        </div>
    </div>
</slot>