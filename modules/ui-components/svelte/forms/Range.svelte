<script>
    import FormElement from './FormElement.svelte';

    export let name = '';
    export let label = '';
    export let tip = '';
    export let value = null;
    export let min = 0;
    export let max = 100;
    export let step = 1;
    export let rules = '';
    export let disabled = false;
    export let className = 'kc-component--range';
</script>

<style lang="scss">
:global(.kc-component--range .input) {
    flex-direction: column;
    align-items: flex-start !important;
}

:global(.kc-component--range) {
    .label {
        flex: 1;
        text-align: left;
        padding-right: 1rem;
        margin-bottom: 1rem;
    }

    .value {
        color: var(--kc-color--text-main);
    }

    .range-slider {
        -webkit-appearance: none;  /* Override default CSS styles */
        width: 100%;
        width: 12rem;
        height: 1rem;
        margin-top: .25rem;
        background: var(--kc-color--bg-dark);
        outline: none;
        border-radius: .5rem;
        cursor: pointer;
        position: relative;

        &:focus, &:active {
            outline: none;
        }

        /* The slider handle (use -webkit- (Chrome, Opera, Safari, Edge) and -moz- (Firefox) to override default look) */
        &::-webkit-slider-thumb {
            -webkit-appearance: none;
            appearance: none;
            border-radius: 50%;
            width: 1.5rem;
            height: 1.5rem;
            background: var(--kc-color--success-green);
            cursor: pointer;
        }

        &::-moz-range-thumb {
            border: none;
            border-radius: 50%;
            width: 1.5rem;
            height: 1.5rem;
            background: var(--kc-color--success-green);
            cursor: pointer;
        }
    }

    &.disabled {
        .label, .value {
            color: var(--kc-color--text-pale);
        }

        .range-slider {
            background: var(--kc-color--text-secondary);

            &::-webkit-slider-thumb {
                background: var(--kc-color--text-pale);
            }

            &::-moz-range-thumb {
                background: var(--kc-color--text-pale);
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
    
    <div class="value">
        <input class="range-slider"
            name={ name }
            type="range" 
            min={ min }
            max={ max }
            step={ step }
            bind:value={ value }>
    </div>
</FormElement>