<script>
    import { getContext, onDestroy, createEventDispatcher } from 'svelte';

    export let className = '';

    export let name = '';
    export let tip = '';
    export let value = null;
    export let rules = '';
    export let disabled = false;

    let initialValue = null;
    let previousValue = null;
    const setFormElement = getContext('setFormElement');
    const removeFormElement = getContext('removeFormElement');
    const errors = getContext('errors');

    const dispatch = createEventDispatcher();

    $: {
        if (setFormElement) {
            setFormElement(name, {
                value,
                initialValue,
                rules
            });
        }
    }

    $: {
        if (previousValue !== value) {
            previousValue = value;

            dispatch('changed');
        }
    }

    (() => {
        initialValue = value;
        previousValue = value;

        if (setFormElement) {
            setFormElement(name, {
                value,
                initialValue,
                rules
            });
        }
    })();

    onDestroy(() => {
        if (removeFormElement) {
            removeFormElement(name);
        }
    });
</script>

<style lang="scss">
.element {
    background: var(--kc-color--bg-secondary);
    color: var(--kc-color--text-secondary);
    transition: background .15s ease;
    padding: .75rem 1.25rem;
    position: relative;

    &:hover {
        background: var(--kc-color--bg-secondary-hover);
    }

    &.disabled {
        pointer-events: none;
        color: var(--kc-color--text-pale);

        .messages p {
            color: var(--kc-color--text-pale);
        }
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

        {#if errors && $errors[name] && $errors[name].length}
            <p class="error">{ $errors[name][0] }</p>
        {/if}
    </div>
</div>
