<script>
    import { setContext, onDestroy } from 'svelte';
    import { writable } from 'svelte/store';
    import FormValidator from '../../js/form-validator/FormValidator.js';

    let elements = {};
    let errors = {};
    let errorsStore = writable(errors);

    setContext('setFormElement', setFormElement);
    setContext('errors', errorsStore);

    function setFormElement(name, el) {
        elements[name] = el;
        errors[name] = [];
    }

    function clearErrors() {
        for (let name in errors) {
            errors[name] = [];
        }

        errorsStore.set(errors);
    }

    export function validate() {
        clearErrors();

        let passed = true;
        
        for (let name in elements) {
            const el = elements[name];

            errors[name] = FormValidator.validate(el.value, el.rules);

            if (errors[name].length) {
                passed = false;
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