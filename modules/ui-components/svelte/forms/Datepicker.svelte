<script>
    import FormElement from './FormElement.svelte';
    import Datepicker from 'svelte-calendar';

    export let name = '';
    export let label = '';
    export let placeholder = '';
    export let tip = '';
    export let value = new Date();
    export let rules = '';

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
}
</style>

<FormElement name={name}
    tip={tip}
    rules={rules}
    bind:value={value}
    className={className}
>
    <div class="label">{ label }</div>
    
    <div class="value">
        <!-- NOTE: There's a '<Popover> received an unexpected slot "default"' warning. This is a known bug in this component and doesn't look like it's going to be fixed anytime soon. -->
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