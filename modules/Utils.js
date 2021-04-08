class Utils
{
    static cloneArray(arr) {
        const newArr = [];

        for (let item of arr) {
            newArr.push(JSON.parse(JSON.stringify(item)));
        }

        return newArr;
    }

    static formatDateBit(bit) {
        return bit >= 10 ? bit : `0${bit}`;
    }

    static formatDate(dateObj, format = 'YYYY-MM-DD') {
        const YYYY = dateObj.getFullYear();
        const MM = Utils.formatDateBit(dateObj.getMonth() + 1);
        const DD = Utils.formatDateBit(dateObj.getDate());

        return format.replace('YYYY', YYYY)
            .replace('MM', MM)
            .replace('DD', DD);
    }
}

export default Utils;