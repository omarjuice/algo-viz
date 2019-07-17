"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const check = (length) => {
    if (typeof length !== 'number')
        throw new Error('length must be a number');
    if (length > 1000)
        throw new Error('Requested length is too high. length < 1000');
};
const array = {
    sortedInts: (length = 10, random = true) => {
        check(length);
        const arr = [];
        for (let i = 0; i < length; i++) {
            arr.push(random ? Math.round(Math.random() * length) : i + 1);
        }
        return arr.sort((a, b) => a - b);
    },
    randomInts: (length = 10, allowNegative = true) => {
        check(length);
        const len = allowNegative ? Math.floor(length / 2) : length;
        const arr = [];
        for (let i = 0; i < length; i++) {
            const negator = allowNegative ? Math.random() > .5 ? 1 : -1 : 1;
            arr.push(Math.round(Math.random() * len * negator));
        }
        return arr;
    },
    filterDuplicates: (arr, mutate = true) => {
        if (!Array.isArray(arr))
            throw new Error('Input must be an array');
        if (!mutate)
            return [...new Set(arr)];
        const set = new Set();
        let last = 0;
        for (let i = 0; i < arr.length; i++) {
            if (i in arr) {
                const el = arr[i];
                if (!set.has(el)) {
                    set.add(el);
                    if (last !== i) {
                        const lastExists = last in arr;
                        [arr[last], arr[i]] = [arr[i], arr[last]];
                        if (!lastExists) {
                            delete arr[i];
                        }
                    }
                    last++;
                }
                else {
                    delete arr[i];
                }
            }
        }
        arr.splice(last, arr.length - last);
        return arr;
    },
};
exports.default = array;
