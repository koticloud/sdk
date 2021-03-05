<script>
    import FormElement from './FormElement.svelte';

    export let name = '';
    export let label = '';
    export let placeholder = '';
    export let tip = '';
    export let value = null;
    export let rules = '';
</script>

<style lang="scss">
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
</style>

<FormElement name={name} tip={tip} rules={rules} bind:value={value}>
    <div class="label">{ label }</div>
    
    <div class="value">
        <input type="text"
            bind:value={value}
            placeholder={placeholder}>
    </div>
</FormElement>