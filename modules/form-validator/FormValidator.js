import Required from './rules/Required.js';
import IsNumber from './rules/IsNumber.js';
import MinValue from './rules/MinValue.js';
import Integer from './rules/Integer.js';
import MaxValue from './rules/MaxValue.js';
import Unique from './rules/Unique.js';

class FormValidator
{
    static validators = {
        'required': Required,
        'number': IsNumber,
        'min_value': MinValue,
        'max_value': MaxValue,
        'integer': Integer,
        'unique': Unique,
        // TODO: Add more validators, see Laravel validation rules for ideas
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
    static async validate(value, rules) {
        let errors = [];

        if (!rules || !rules.length) {
            return errors;
        }

        rules = rules.split('|');

        for (let rule of rules) {
            const ruleParts = rule.split(':');
            rule = ruleParts[0];
            const args = ruleParts[1] ? ruleParts[1].split(',') : [];

            const validatorClass = this.getValidator(rule);
            let error = await new validatorClass(args).check(value);

            if (error !== true) {
                errors.push(error);
            }
        }

        return errors;
    }
}

export default FormValidator;