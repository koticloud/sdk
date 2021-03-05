class Rule
{
    constructor(args) {
        this.args = args;
    }

    isValid(value) {
        return true;
    }

    message() {
        return 'Invalid value.';
    }

    check(value) {
        return this.isValid(value) ? true : this.message();
    }
}

export default Rule;