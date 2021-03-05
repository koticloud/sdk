import Rule from './Rule.js';

class MaxValue extends Rule
{
    isValid(value) {
        const maxValue = parseFloat(this.args[0]);

        return parseFloat(value) <= maxValue;
    }

    message() {
        const maxValue = parseFloat(this.args[0]);

        return `The number should be less than or equal to ${maxValue}.`;
    }
}

export default MaxValue;