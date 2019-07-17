"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class SLL {
    constructor(val) {
        this.value = val;
        this.next = null;
    }
    static create(elems) {
        if (!Array.isArray(elems))
            throw new Error('SLL elements must be given in array form');
        if (!elems.length)
            throw new Error('Elements must have a length of at least 1');
        const list = new SLL(elems[0]);
        let current = list;
        for (let i = 1; i < elems.length; i++) {
            current = current.next = new SLL(elems[i]);
        }
        return list;
    }
    static reverse(list) {
        this.assert(list);
        let current = list;
        let prev = null;
        const seen = new Set();
        while (current) {
            if (seen.has(current))
                throw new Error('Cannot reverse cyclic list');
            const next = current.next;
            current.next = prev;
            prev = current;
            seen.add(current);
            current = next;
        }
        return prev;
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
        if (!('next' in list) || !('value' in list))
            throw new Error('List must have properties "next" and "value"');
    }
}
exports.default = SLL;
