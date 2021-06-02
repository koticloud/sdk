<script>
    import FormElement from './FormElement.svelte';

    export let name = '';
    export let label = '';
    export let tip = '';
    export let options = {};
    export let value = null;
    export let rules = '';
    export let disabled = false;
    export let inline = false;
    export let className = 'kc-component--radiogroup';
</script>

<style lang="scss">
:global(.kc-component--radiogroup .input) {
    flex-direction: column;
    align-items: flex-start !important;
}

:global(.kc-component--radiogroup) {
    .label {
        flex: 1;
        text-align: left;
        padding-right: 1rem;
        margin-bottom: 1rem;
    }

    .value {
        color: var(--kc-color--text-main);

        &.inline {
            display: flex;
            flex-wrap: wrap;

            .radio {
                margin-right: 1rem;

                &:last-of-type {
                    margin-right: 0;
                }
            }
        }
    }

    .radio {
        display: block;
        position: relative;
        cursor: pointer;
        padding-left: 2rem;
        min-height: 2rem;
        display: flex;
        align-items: center;


        input {
            position: absolute;
            opacity: 0;
            cursor: pointer;
            height: 0;
            width: 0;
        }

        label {
            cursor: pointer;
        }

        .checkmark {
            position: absolute;
            top: 50%;
            left: 0;
            transform: translateY(-50%);
            height: 1.5rem;
            width: 1.5rem;
            background-color: var(--kc-color--bg-dark);
            border: 1px solid var(--kc-color--bg-dark);
            border-radius: 50%;
        }

        &:hover .checkmark {
            background-color: var(--kc-color--text-secondary);
            border-color: var(--kc-color--text-secondary);
        }

        input:checked ~ .checkmark {
            background-color: var(--kc-color--success-green);
            border-color: var(--kc-color--success-green);
        }
    }

    &.disabled {
        .label, .value {
            color: var(--kc-color--text-pale);
        }

        .radio {
            .checkmark {
                background-color: var(--kc-color--text-secondary);
                border: 1px solid var(--kc-color--text-secondary);
            }

            input:checked ~ .checkmark {
                background-color: var(--kc-color--text-pale);
                border-color: var(--kc-color--text-pale);
            }
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
    {#if label}
        <div class="label kc--no-select">{ label }</div>
    {/if}
    
    <div class="value" class:inline={ inline }>
        {#each Object.keys(options) as key}
            <label class="radio" for="{name}-{key}">
                <input type="radio"
                    id="{name}-{key}"
                    name={ name }
                    value={ key }
                    bind:group={ value }>

                <span class="text">{ options[key] }</span>

                <div class="checkmark"></div>
            </label>
        {/each}
    </div>
</FormElement>