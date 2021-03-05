import Rule from './Rule.js';

class Required extends Rule
{
    static isValid(value) {
        if (isNaN(value)) {
            return false;
        }

        // isNaN allows invalid numbers like 0000 or 0001 or 01, so additional checks
        // are needed
        if (typeof value === 'string') {
            const parts = value.split('.');

            // Make sure the number doesn't start with a zero unless it's a zero or
            // a float
            if (parts[0].length > 1 && parts[0][0] === '0') {
                return false;
            }
        }

        return true;
    }

    static message() {
        return 'The value should be a valid number.';
    }
}

export default Required;