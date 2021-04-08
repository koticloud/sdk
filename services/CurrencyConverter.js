import Api from "../modules/Api";
import App from "../modules/App";
import Utils from "../modules/Utils";

class CurrencyConverter
{
    static rates = null;

    /**
     * Fetch the requested rates from the API, store in the local DB.
     * Format: PHP_RUB_2020-04-01
     * 
     * @param {array} rates 
     * @param {boolean} force 
     */
    static async updateRates(rates, force = false) {
        const db = App.get().db;

        if (db === null) {
            throw 'CurrencyConverter service requires your app to have a local DB to work properly.';
        }

        // Exclude rates that are already stored locally
        const filteredRates = [];

        if (!force) {
            for (let i = 0; i < rates.length; i++) {
                const [from, to, date] = rates[i].split('_');
                const localRate = await CurrencyConverter.getRate(from, to, date);

                if (localRate === null || localRate === undefined) {
                    filteredRates.push(rates[i]);
                }
            }
        } else {
            filteredRates = rates;
        }

        if (!filteredRates.length) {
            return true;
        }

        // Fetch currency rates from the API
        let results;

        try {
            results = (await Api.getCurrencyRates(filteredRates)).data;
        } catch (err) {
            return false;
        }

        // Store/update the rates in the local DB
        const localRates = await db.collection('_service_currency_rates').get();

        for (let key in results) {
            const [from, to, date] = key.split('_');
            let localRate = localRates.docs.find(item => {
                return item.currency_from === from
                    && item.currency_to === to
                    && item.date === date;
            });

            // Don't update the local rate if the rate hasn't changed
            if (localRate && localRate.rate === results[key]) {
                continue;
            }

            if (!localRate) {
                localRate = {};
            }

            localRate.currency_from = from;
            localRate.currency_to = to;
            localRate.date = date;
            localRate.rate = results[key];

            await db.collection('_service_currency_rates')
                .updateOrCreate(localRate);
        }

        // Update the "cached" rates map
        CurrencyConverter.rates = null;
        await CurrencyConverter.getRatesMap();

        return true;
    }

    static async getRatesMap() {
        if (!CurrencyConverter.rates) {
            const db = App.get().db;

            if (db === null) {
                throw 'CurrencyConverter service requires your app to have a local DB to work properly.';
            }

            const data = await db.collection('_service_currency_rates').get();
            const map = {};

            for (let i = 0; i < data.docs.length; i++) {
                const item = data.docs[i];
                const key = `${item.currency_from}_${item.currency_to}_${item.date}`;

                if (!map.hasOwnProperty(key)) {
                    map[key] = item.rate;
                } else {
                    // Delete duplicate data if any since we're looping through
                    // all the local rates
                    await db.collection('_service_currency_rates').delete(item);
                }
            }
            
            CurrencyConverter.rates = map;
        }

        return CurrencyConverter.rates;
    }

    /**
     * Get currency conversion rate on a certain date.
     * 
     * @param {string} fromCurrency 
     * @param {string} toCurrency 
     * @param {string} date 
     */
    static async getRate(fromCurrency, toCurrency, date = null) {
        const db = App.get().db;

        if (db === null) {
            throw 'CurrencyConverter service requires your app to have a local DB to work properly.';
        }

        if (!date) {
            date = Utils.formatDate(new Date());
        }

        // Try to find rate locally
        const key = `${fromCurrency}_${toCurrency}_${date}`;
        const rate = (await CurrencyConverter.getRatesMap())[key];

        return rate || null;
    }

    /**
     * Convert a monetary value from one currency to another.
     * 
     * @param {float} value 
     * @param {string} fromCurrency 
     * @param {string} toCurrency 
     */
    static async convert(value, fromCurrency, toCurrency, date = null) {
        const rate = await CurrencyConverter.getRate(fromCurrency, toCurrency, date);

        if (!rate) {
            return null;
        }

        return value * rate;
    }
}

export default CurrencyConverter;