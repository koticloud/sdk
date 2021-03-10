<script>
    import { setContext, onDestroy } from 'svelte';
    import { writable } from 'svelte/store';
    import FormValidator from '../../../form-validator/FormValidator.js';

    export let extraValidation = null;

    let elements = {};
    let errors = {};
    let errorsStore = writable(errors);

    setContext('setFormElement', setFormElement);
    setContext('removeFormElement', removeFormElement);
    setContext('errors', errorsStore);

    function setFormElement(name, el) {
        elements[name] = el;
        errors[name] = [];
    }

    function removeFormElement(name) {
        delete elements[name];
        delete errors[name];
    }

    function clearErrors() {
        for (let name in errors) {
            errors[name] = [];
        }

        errorsStore.set(errors);
    }

    function addError(field, error) {
        if (!errors[field]) {
            errors[field] = [];
        }

        errors[field].push(error);
    }

    export async function validate() {
        clearErrors();

        let passed = true;
        
        for (let name in elements) {
            const el = elements[name];

            errors[name] = await FormValidator.validate(el.value, el.rules);
        }

        // Optional extra validation
        if (typeof extraValidation === 'function') {
            await extraValidation(elements, addError);
        }

        for (let name in errors) {
            if (errors[name].length > 0) {
                passed = false;

                break;
            }
        }

        errorsStore.set(errors);

        return passed;
    }

    export function hasChanges() {
        for (let name in elements) {
            const el = elements[name];

            if (el.initialValue !== el.value) {
                return true;
            }
        }

        return false;
    }

    onDestroy(() => {
        errors = {};
        errorsStore.set({});
    });
</script>

<slot></slot>