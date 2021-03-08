import Rule from './Rule.js';

class MinValue extends Rule
{
    isValid(value) {
        const minValue = parseFloat(this.args[0]);

        return parseFloat(value) >= minValue;
    }

    message() {
        const minValue = parseFloat(this.args[0]);

        return `The number should be equal to or greater than ${minValue}.`;
    }
}

export default MinValue;