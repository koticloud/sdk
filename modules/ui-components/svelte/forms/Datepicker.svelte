<script>
    import FormElement from './FormElement.svelte';
    import Datepicker from 'svelte-calendar';

    export let name = '';
    export let label = '';
    export let placeholder = '';
    export let tip = '';
    export let value = null;
    export let rules = '';

    export let selected = new Date();
    export let minDate = new Date(0);   // Earliest date possible
    export let maxDate = new Date();
    export let format = '#{F} #{d}, #{Y}';
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
</style>

<FormElement name={name} tip={tip} rules={rules} bind:value={value}>
    <div class="label">{ label }</div>
    
    <div class="value">
        <!-- NOTE: There's a '<Popover> received an unexpected slot "default"' warning. This is a known bug in this component and doesn't look like it's going to be fixed anytime soon. -->
        <Datepicker bind:selected={selected}
            bind:formattedSelected={value}
            start={minDate}
            end={maxDate}
            style="width: 100%; text-align: right;"
            format={format}
            highlightColor='#0091ff'
            dayHighlightedBackgroundColor='#0091ff'
            dayHighlightedTextColor='#fff'
        >
            {value ? value : '-'}
        </Datepicker>
    </div>
</FormElement>