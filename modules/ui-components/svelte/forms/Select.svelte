<script>
    import App from '../../../App';
    import FormElement from './FormElement.svelte';

    export let name = '';
    export let label = '';
    export let tip = '';
    export let options = {};
    export let value = null;
    export let rules = '';
    export let disabled = false;
    export let className = 'kc-component--select';

    function showSelect() {
        if (disabled) {
            return;
        }

        const selectOptions = {
            title: label,
            selected: value,
            options: options,
        };

        App.get().ui.select(selectOptions, label)
            .then(_value => {
                value = _value;
            })
            // Ignore cancel/error
            .catch(err => {});
    }
</script>

<style lang="scss">
:global(.kc-component--select) {
    cursor: pointer;

    &:active {
        background: var(--kc-color--bg-accent) !important;
        color: var(--kc-color--text-accent) !important;

        .value, :global(.tip) {
            color: var(--kc-color--text-accent) !important;
        }
    }

    .label {
        flex: 1;
        text-align: left;
        padding-right: 1rem;
    }

    .value {
        color: var(--kc-color--text-main);
    }

    .caret {
        margin-left: .5rem;
    }

    &.disabled {
        .label, .value {
            color: var(--kc-color--text-pale);
        }

        .caret {
            display: none;
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
    on:click={showSelect}
>
    {#if label}
        <div class="label">{ label }</div>
    {/if}
    
    <div class="value">
        { value !== undefined && value !== null && options.hasOwnProperty(value) ? options[value] : '-' }
    </div>

    <div class="caret">
        &#9662;
    </div>
</FormElement>