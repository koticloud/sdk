import PouchDB from 'pouchdb';

class DB
{
    constructor(name) {
        this._db = new PouchDB(name);
    }
}

export default DB;