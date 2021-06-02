import App from '../../App.js';
import Rule from './Rule.js';

class Unique extends Rule
{
    async isValid(value) {
        let query = App.get().db.collection(this.args[0])
            .where(this.args[1], value);
        
        // Optionally exclude the row with the specified _id
        if (this.args[2] !== undefined && this.args[2] !== null) {
            query = query.where('_id', '!=', this.args[2]);
        }

        let exists = await query.first();

        return !exists;
    }

    message() {
        return `The value should be unique.`;
    }
}

export default Unique;