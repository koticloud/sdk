class Utils
{
    static cloneArray(arr) {
        const newArr = [];

        for (let item of arr) {
            newArr.push(JSON.parse(JSON.stringify(item)));
        }

        return newArr;
    }
}

export default Utils;