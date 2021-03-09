import App from '../../App.js';
import Rule from './Rule.js';

class Unique extends Rule
{
    async isValid(value) {
        let exists = await App.get().db.collection(this.args[0])
            .where(this.args[1], value)
            .first();

        return !exists;
    }

    message() {
        return `The value should be unique.`;
    }
}

export default Unique;