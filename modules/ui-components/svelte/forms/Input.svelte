<script>
    import FormElement from './FormElement.svelte';
    import Popover from '../misc/Popover.svelte';
    import { createEventDispatcher } from 'svelte';

    const dispatch = createEventDispatcher();

    export let name = '';
    export let label = '';
    export let placeholder = '';
    export let tip = '';
    export let value = null;
    export let rules = '';
    export let disabled = false;
    export let autocomplete = [];
    export let className = 'kc-component--input';
    let showAutocomplete = false;

    function onFocus() {
        showAutocomplete = true;
    }

    function onBlur() {
        showAutocomplete = false;
        autocomplete = [];
    }

    function autocompleteSelected(item) {
        value = item;

        dispatch('autocomplete-selected', item);
    }
</script>

<style lang="scss">
.label {
    text-align: left;
    padding-right: 1rem;
}

.value {
    flex: 1;

    position: relative;
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

:global(.dropdown) {
    width: 100%;
    left: 0;
    // 5 items max (1 item = 2.25rem).
    max-height: 11.25rem;
    overflow-y: auto;

    color: var(--kc-color--text-main);
    background: var(--kc-color--bg-main);
    border: 1px solid var(--kc-color--bg-accent);
    border-top: 0;

    .item {
        padding: .5rem;
        
        &:hover {
            background: var(--kc-color--bg-accent);
            color: var(--kc-color--text-accent);
            cursor: pointer;
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
    on:changed
>
    {#if label}
        <div class="label">{ label }</div>
    {/if}
    
    <div class="value">
        <input type="text"
            bind:value={value}
            on:input
            on:blur={onBlur}
            on:focus={onFocus}
            placeholder={placeholder}
            disabled={disabled}
            autocomplete="off">

        {#if autocomplete && autocomplete.length && showAutocomplete}
            <Popover className="dropdown">
                {#each autocomplete as item}
                    <div class="item" on:mousedown={() => autocompleteSelected(item)}>
                        { item }
                    </div>
                {/each}
            </Popover>
        {/if}
    </div>
</FormElement>