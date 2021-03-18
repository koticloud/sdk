<script>
    import FormElement from './FormElement.svelte';

    export let name = '';
    export let label = '';
    export let placeholder = '';
    export let tip = '';
    export let value = null;
    export let rules = '';
    export let disabled = false;

    let className = 'kc-component--input';
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
    border: 1px solid var(--kc-color--bg-secondary);

    &:focus, &:active {
        border-color: var(--kc-color--bg-accent);
    }
}

:global(.kc-component--input.disabled) {
    .label, .value {
        color: var(--kc-color--text-pale);
    }

    .value input {
        color: var(--kc-color--text-pale);

        &:focus, &:active {
            border-color: var(--kc-color--bg-secondary);
        }
    }
}
</style>

<FormElement name={name}
    tip={tip}
    rules={rules}
    disabled={disabled}
    bind:value={value}
    className={className + (disabled ? ' disabled' : '')}
>
    <div class="label">{ label }</div>
    
    <div class="value">
        <input type="text"
            bind:value={value}
            on:input
            placeholder={placeholder}
            disabled={disabled}>
    </div>
</FormElement>