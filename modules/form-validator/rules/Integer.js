import Rule from './Rule.js';

class Integer extends Rule
{
    isValid(value) {
        if (value === null || value === undefined) {
            return false;
        }

        const n = Math.floor(Number(value));

        return n !== Infinity && String(n) === String(value);
    }

    message() {
        return 'The value should be an integer number.';
    }
}

export default Integer;