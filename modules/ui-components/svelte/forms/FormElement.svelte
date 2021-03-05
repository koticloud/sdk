<script>
    import { getContext } from 'svelte';

    export let className = '';

    export let name = '';
    export let tip = '';
    export let value = null;
    export let rules = '';

    const setFormElement = getContext('setFormElement');
    const errors = getContext('errors');

    $: {
        setFormElement(name, {
            value,
            rules
        })
    }

    setFormElement(name, {
        value,
        rules
    });
</script>

<style lang="scss">
.element {
    background: var(--kc-color--bg-secondary);
    color: var(--kc-color--text-secondary);
    transition: background .15s ease;
    padding: .75rem 1.25rem;

    &:hover {
        background: var(--kc-color--bg-secondary-hover);
    }

    .input {
        display: flex;
        align-items: center;
    }

    .messages p {
        margin-top: .25rem;
        font-style: italic;
        font-size: .8rem;
        text-align: right;
        color: var(--kc-color--text-secondary);

        &.error {
            color: var(--kc-color--danger-red);
        }
    }
}
</style>

<div class="element {className}" on:click>
    <div class="input">
        <slot></slot>
    </div>

    <div class="messages">
        {#if tip}
            <p class="tip">{ tip }</p>
        {/if}

        {#if $errors[name] && $errors[name].length}
            <p class="error">{ $errors[name][0] }</p>
        {/if}
    </div>
</div>
