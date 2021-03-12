<script>
    import FormElement from './FormElement.svelte';

    export let name = '';
    export let label = '';
    export let placeholder = '';
    export let tip = '';
    export let value = false;
    export let rules = '';
    export let disabled = false;

    let className = 'kc-component--switch';
</script>

<style lang="scss">
.label {
    text-align: left;
    padding-right: 1rem;
}

.value {
    flex: 1;
    text-align: right;
}

.switch {
    display: inline-block;
    position: relative;
    width: 2.75rem;
    height: 1.5rem;
    cursor: pointer;

    input {
        position: absolute;
        opacity: 0;
        cursor: pointer;
        height: 0;
        width: 0;
        left: 0;
    }

    .slider {
        position: absolute;
        top: 0;
        left: 0;
        height: 100%;
        width: 100%;
        background-color: var(--kc-color--bg-dark);
        border: 1px solid var(--kc-color--bg-dark);
        border-radius: 100rem;
        transition: all .4s ease;

        &:before {
            content: "";
            position: absolute;
            height: 1.1rem;
            width: 1.1rem;
            left: 2px;
            top: 2px;
            background-color: #fafafa;
            box-shadow: 0 1px 2px;
            border-radius: 50%;
            transition: all .4s ease;
        }
    }

    input:checked ~ .slider {
        background-color: var(--kc-color--success-green);
        border: 1px solid var(--kc-color--success-green);

        &:before {
            transform: translateX(1.25rem);
        }
    }

    &.disabled {
        .slider {
            background-color: var(--kc-color--text-pale) !important;
            border: 1px solid var(--kc-color--text-pale) !important;
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
        <label class="switch" class:disabled={disabled}>
            <input class="form-element" 
                type="checkbox"
                autocomplete="off"
                bind:checked={value}>

            <span class="slider"></span>
        </label>
    </div>
</FormElement>