import Required from './rules/Required.js';

class FormValidator
{
    static validators = {
        'required': Required,
    };

    static getValidator(rule) {
        if (!this.validators[rule]) {
            throw `Unknown validation rule: ${rule}`;
        }

        return this.validators[rule];
    }

    /**
     * Validate a value. Return an array with error messages or an empty array
     * if there are no errors.
     * 
     * @param {mixed} value 
     * @param {string} rules 
     * @return {array}
     */
    static validate(value, rules) {
        let errors = [];

        if (!rules || !rules.length) {
            return errors;
        }

        rules = rules.split('|');

        for (let rule of rules) {
            let error = this.getValidator(rule).check(value);

            if (error !== true) {
                errors.push(error);
            }
        }

        return errors;
    }
}

export default FormValidator;