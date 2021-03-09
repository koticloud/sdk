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

    async check(value) {
        const isValid = await this.isValid(value);

        return isValid ? true : this.message();
    }
}

export default Rule;