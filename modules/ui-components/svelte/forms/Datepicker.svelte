<script>
    import FormElement from './FormElement.svelte';
    import Datepicker from 'svelte-calendar';

    export let name = '';
    export let label = '';
    export let placeholder = '';
    export let tip = '';
    export let value = new Date();
    export let rules = '';
    export let disabled = false;

    export let minDate = new Date(0);   // Earliest date possible
    export let maxDate = new Date();
    export let format = '#{F} #{d}, #{Y}';

    let className = 'kc-component--datepicker';
    let formattedSelected = '';
</script>

<style lang="scss">
.label {
    text-align: left;
    padding-right: 1rem;
}

.value {
    flex: 1;
    cursor: pointer;
    color: var(--kc-color--text-main);
}

:global(.kc-component--datepicker) {
    &:active {
        background: var(--kc-color--bg-accent) !important;
        color: var(--kc-color--text-accent) !important;

        .value, :global(.tip) {
            color: var(--kc-color--text-accent) !important;
        }
    }

    .value {
        color: var(--kc-color--text-main);
    }

    &.disabled {
        .value {
            color: var(--kc-color--text-pale);
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
        <Datepicker bind:selected={value}
            bind:formattedSelected={formattedSelected}
            start={minDate}
            end={maxDate}
            style="width: 100%; text-align: right;"
            format={format}
            highlightColor='#0091ff'
            dayHighlightedBackgroundColor='#0091ff'
            dayHighlightedTextColor='#fff'
        >
            {formattedSelected ? formattedSelected : '-'}
        </Datepicker>
    </div>
</FormElement>