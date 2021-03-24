<script>
    import FormElement from './FormElement.svelte';
    import Tags from "svelte-tags-input";

    export let name = '';
    export let label = '';
    export let placeholder = '';
    export let tip = '';
    export let value = null;
    export let rules = '';
    export let disabled = false;

    export let autocomplete = [];
    export let onlyUnique = true;

    let className = 'kc-component--tags-input';

    function onTagsUpdated(event) {
        value = event.detail.tags;
    }
</script>

<style lang="scss">
.label {
    text-align: left;
    padding-right: 1rem;
}

.value {
    flex: 1;
}

:global(.svelte-tags-input-layout) {
    width: 100%;
    font-family: inherit !important;
    color: var(--kc-color--text-main) !important;
    margin: 0 !important;
    padding-top: 5px !important;

    background: var(--kc-color--bg-main);
    border: 1px solid var(--kc-color--bg-secondary) !important;

    &:focus, &:active {
        border-color: var(--kc-color--bg-accent) !important;
    }
}

:global(.svelte-tags-input) {
    margin: 0 !important;
    font-family: inherit !important;
    color: var(--kc-color--text-main) !important;
}

:global(.svelte-tags-input-tag) {
    font-family: inherit !important;
    background: var(--kc-color--bg-accent) !important;
}

:global(.svelte-tags-input-matchs li:hover, .svelte-tags-input-matchs li:focus) {
    font-family: inherit !important;
    background: var(--kc-color--bg-accent) !important;
    color: var(--kc-color--text-accent) !important;
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
        <Tags on:tags={onTagsUpdated}
            autoComplete={autocomplete}
            onlyUnique={onlyUnique}
            tags={value} />
    </div>
</FormElement>