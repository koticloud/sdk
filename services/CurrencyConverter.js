import Api from "../modules/Api";
import App from "../modules/App";

class CurrencyConverter
{
    /**
     * Fetch the requested rates from the API, store in the local DB.
     * Format: PHP_RUB_2020-04-01
     * 
     * @param {array} rates 
     */
    static async updateRates(rates) {
        const db = App.get().db;

        if (db === null) {
            throw 'CurrencyConverter service requires your app to have a local DB to work properly.';
        }

        // Fetch currency rates from the API
        let results;

        try {
            results = (await Api.getCurrencyRates(rates)).data;
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

        return true;
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
            date = new Date().toISOString().split('T')[0];
        }

        // Try to find rate locally
        let rate = await db.collection('_service_currency_rates')
            .where('currency_from', fromCurrency)
            .where('currency_to', toCurrency)
            .where('date', date)
            .first();

        if (rate) {
            return rate.rate;
        }

        // If rate not found locally - try fetching it from API
        await CurrencyConverter.updateRates([`${fromCurrency}_${toCurrency}_${date}`]);

        // Get the rate again
        rate = await db.collection('_service_currency_rates')
            .where('currency_from', fromCurrency)
            .where('currency_to', toCurrency)
            .where('date', date)
            .first();

        return rate ? rate.rate : null;
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