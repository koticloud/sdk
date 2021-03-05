import Rule from './Rule.js';

class IsNumber extends Rule
{
    isValid(value) {
        const n = Number(value);

        return n !== Infinity && String(n) === value;
    }

    message() {
        return 'The value should be a valid number.';
    }
}

export default IsNumber;