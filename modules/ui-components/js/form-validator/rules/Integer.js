import Rule from './Rule.js';

class Integer extends Rule
{
    isValid(value) {
        const n = Math.floor(Number(value));

        return n !== Infinity && String(n) === value;
    }

    message() {
        return 'The value should be an integer number.';
    }
}

export default Integer;