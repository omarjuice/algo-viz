"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class DLL {
    constructor(val, prev) {
        this.next = null;
        this.prev = null;
        this.value = val;
        this.prev = prev || null;
    }
    static create(elems) {
        if (!Array.isArray(elems))
            throw new Error('DLL elements must be given in array form');
        if (!elems.length)
            throw new Error('Elements must have a length of at least 1');
        const list = new DLL(elems[0]);
        let current = list;
        for (let i = 1; i < elems.length; i++) {
            current = current.next = new DLL(elems[i], current);
        }
        return list;
    }
    static toArray(list) {
        const elems = [];
        this.forEach(list, val => elems.push(val));
        return elems;
    }
    static forEach(list, callback) {
        this.assert(list);
        const seen = new Set();
        for (let current = list; !!current; current = current.next) {
            if (seen.has(current))
                throw new Error('Cannot convert a cyclic list to array');
            callback(current.value);
            seen.add(current);
        }
    }
    static assert(list) {
        if (!('next' in list) || !('value' in list) || !('prev' in list))
            throw new Error('List must have properties "next" and "value"');
    }
}
exports.default = DLL;
