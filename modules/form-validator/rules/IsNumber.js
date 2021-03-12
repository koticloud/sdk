import Rule from './Rule.js';

class IsNumber extends Rule
{
    isValid(value) {
        if (typeof value === 'number') {
            return true;
        }

        const parts = value.split('.');
        const precision = parts.length > 1
            ? parts[1].length
            : 0;
        
        const n = Number(value);

        return n !== Infinity && n.toFixed(precision) === value;
    }

    message() {
        return 'The value should be a valid number.';
    }
}

export default IsNumber;