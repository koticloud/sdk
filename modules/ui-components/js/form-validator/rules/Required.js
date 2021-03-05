import Rule from './Rule.js';

class Required extends Rule
{
    static isValid(value) {
        if (typeof value === 'string') {
            return value.trim().length > 0;
        }

        return value !== undefined && value !== null;
    }

    static message() {
        return 'This field is required.';
    }
}

export default Required;