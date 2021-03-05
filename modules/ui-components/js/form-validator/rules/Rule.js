class Rule
{
    static isValid(value) {
        return true;
    }

    static message() {
        return 'Invalid value.';
    }

    static check(value) {
        return this.isValid(value) ? true : this.message();
    }
}

export default Rule;