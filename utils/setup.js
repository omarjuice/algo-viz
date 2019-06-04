const TYPES = require('./types')

const {
    concat,
    copyWithin,
    entries,
    every,
    fill,
    filter,
    find,
    findIndex,
    forEach,
    includes,
    indexOf,
    join,
    keys,
    lastIndexOf,
    map,
    pop,
    push,
    reduce,
    reduceRight,
    reverse,
    shift,
    slice,
    some,
    sort,
    splice,
    unshift,
    values,
} = Array.prototype

module.exports = {
    setup: function (_name) {
        if (!global[_name]) {
            global[_name] = {
                __(val) {
                    return val
                }
            }
        }
        let allow = true
        const { __: _inspector } = global[_name]
        const __ = (...args) => allow ? _inspector.call(global[_name], ...args) : args[0]

        const __copyWithin = function (target, start, opt_end) {
            // https://cljs.github.io/api/compiler-options/rewrite-polyfills
            let len = this.length;
            target = toInteger(target);
            start = toInteger(start);
            let end = opt_end === undefined ? len : toInteger(opt_end);
            let to = target < 0 ? Math.max(len + target, 0) : Math.min(target, len);
            let from = start < 0 ? Math.max(len + start, 0) : Math.min(start, len);
            let final = end < 0 ? Math.max(len + end, 0) : Math.min(end, len);
            if (to < from) {
                while (from < final) {
                    if (from in this) {
                        __(this[to++] = this[from++], {
                            type: TYPES.PROP_ASSIGNMENT,
                            scope: null,
                            object: this,
                            access: [
                                to
                            ],
                        });
                    } else {
                        __(delete this[to++], {
                            type: TYPES.DELETE,
                            scope: null,
                            object: this,
                            access: [
                                to
                            ],
                        });

                        from++;
                    }
                }
            } else {
                final = Math.min(final, len + from - to);
                to += final - from;
                while (final > from) {
                    if (--final in this) {
                        __(this[--to] = this[final], {
                            type: TYPES.PROP_ASSIGNMENT,
                            scope: null,
                            object: this,
                            access: [
                                to
                            ],
                        });

                    } else {
                        __(delete this[--to], {
                            type: TYPES.DELETE,
                            scope: null,
                            object: this,
                            access: [
                                to
                            ],
                        });
                    }
                }
            }
            return this;
        };
        const __every = function (..._args) {
            if (_args[0]) {
                const [cb] = _args
                _args[0] = (el, i, ...args) => {
                    const result = cb.call(null, el, i, ...args)
                    __(el, {
                        type: TYPES.ACCESSOR,
                        scope: null,
                        object: this,
                        access: [i]
                    })
                    return result
                }
            }
            return every.call(this, ..._args)
        }
        const __findIndex = function (..._args) {
            if (_args[0]) {
                const [cb] = _args
                _args[0] = (el, i, ...args) => {
                    const result = cb.call(null, el, i, ...args)
                    __(el, {
                        type: TYPES.ACCESSOR,
                        scope: null,
                        object: this,
                        access: [i]
                    })
                    return result
                }
            }
            return findIndex.call(this, ..._args)
        }
        const __fill = function (value, opt_start, opt_end) {
            // https://cljs.github.io/api/compiler-options/rewrite-polyfills
            let length = this.length || 0;
            if (opt_start < 0) {
                opt_start = Math.max(0, length + (opt_start));
            }
            if (opt_end == null || opt_end > length) opt_end = length;
            opt_end = Number(opt_end);
            if (opt_end < 0) opt_end = Math.max(0, length + opt_end);
            for (let i = Number(opt_start || 0); i < opt_end; i++) {
                __(this[i] = value, {
                    type: TYPES.PROP_ASSIGNMENT,
                    scope: null,
                    object: this,
                    access: [
                        i
                    ],
                });
            }
            return this;
        };
        const __find = function (..._args) {
            if (_args[0]) {
                const [cb] = _args
                _args[0] = (el, i, ...args) => {
                    const result = cb.call(null, el, i, ...args)
                    __(el, {
                        type: TYPES.ACCESSOR,
                        scope: null,
                        object: this,
                        access: [i]
                    })
                    return result
                }
            }
            return find.call(this, ..._args)
        }
        const __forEach = function (..._args) {
            if (_args[0]) {
                const [cb] = _args
                _args[0] = (el, i, ...args) => {
                    const result = cb.call(null, el, i, ...args)
                    __(el, {
                        type: TYPES.ACCESSOR,
                        scope: null,
                        object: this,
                        access: [i]
                    })
                    return result
                }
            }
            return forEach.call(this, ..._args)
        }
        const __includes = function (searchElement, opt_fromIndex) {
            //https://cljs.github.io/api/compiler-options/rewrite-polyfills
            let array = this;
            if (array instanceof String) {
                array = String(array)
            }
            let len = array.length;
            let i = opt_fromIndex || 0;
            if (i < 0) {
                i = Math.max(i + len, 0);
            }
            for (; i < len; i++) {
                let element = __(array[i], {
                    type: TYPES.ACCESSOR,
                    scope: null,
                    object: this,
                    access: [i]
                })
                if (element === searchElement || Object.is(element, searchElement)) {
                    return true;
                }
            }
            return false;
        };
        const __filter = function (..._args) {
            if (_args[0]) {
                const [cb] = _args
                _args[0] = (el, i, ...args) => {
                    const result = cb.call(null, el, i, ...args)
                    __(el, {
                        type: TYPES.ACCESSOR,
                        scope: null,
                        object: this,
                        access: [i]
                    })
                    return result
                }
            }
            return filter.call(this, ..._args)
        }
        const __indexOf = function (searchElement, fromIndex) {
            // MDN
            let k;
            if (this == null) {
                throw new TypeError('"this" is null or not defined');
            }

            let o = Object(this);
            let len = o.length >>> 0;

            if (len === 0) {
                return -1;
            }

            let n = fromIndex | 0;

            if (n >= len) {
                return -1;
            }
            k = Math.max(n >= 0 ? n : len - Math.abs(n), 0);

            while (k < len) {

                if (k in o && __(o[k], {
                    type: TYPES.ACCESSOR,
                    scope: null,
                    object: this,
                    access: [k]
                }) === searchElement) {
                    return k;
                }
                k++;
            }
            return -1;
        };
        const __lastIndexOf = function (searchElement /*, fromIndex*/) {
            //MDN
            if (this === void 0 || this === null) {
                throw new TypeError();
            }

            var n, k,
                t = Object(this),
                len = t.length >>> 0;
            if (len === 0) {
                return -1;
            }

            n = len - 1;
            if (arguments.length > 1) {
                n = Number(arguments[1]);
                if (n != n) {
                    n = 0;
                }
                else if (n != 0 && n != (1 / 0) && n != -(1 / 0)) {
                    n = (n > 0 || -1) * Math.floor(Math.abs(n));
                }
            }

            for (k = n >= 0 ? Math.min(n, len - 1) : len - Math.abs(n); k >= 0; k--) {
                if (k in t && __(t[k], {
                    type: TYPES.ACCESSOR,
                    scope: null,
                    object: this,
                    access: [k]
                }) === searchElement) {
                    return k;
                }
            }
            return -1;
        };
        const __reverse = function () {
            for (let l = 0, r = this.length - 1; l < r; ++l, --r) {

                [this[l], this[r]] = [this[r], this[l]]
                __(this[l], {
                    type: TYPES.ACCESSOR,
                    scope: null,
                    object: this,
                    access: [l]
                })
                __(this[r], {
                    type: TYPES.ACCESSOR,
                    scope: null,
                    object: this,
                    access: [r]
                })
            }
            return this
        }
        const __map = function (..._args) {
            if (_args[0]) {
                const [cb] = _args
                _args[0] = (el, i, ...args) => {
                    const result = cb.call(null, el, i, ...args)
                    __(el, {
                        type: TYPES.ACCESSOR,
                        scope: null,
                        object: this,
                        access: [i]
                    })
                    return result
                }
            }
            return map.call(this, ..._args)
        }
        const __reduce = function (..._args) {
            if (_args[0]) {
                const [cb] = _args
                _args[0] = (a, el, i, arr) => {
                    const result = cb.call(null, a, el, i, arr)
                    __(el, {
                        type: TYPES.ACCESSOR,
                        scope: null,
                        object: this,
                        access: [i]
                    })
                    return result
                }
            }
            if (!(1 in _args) && 0 in this) {
                __(this[0], {
                    type: TYPES.ACCESSOR,
                    scope: null,
                    object: this,
                    access: [0]
                })
            }
            return reduce.call(this, ..._args)
        }
        const __reduceRight = function (..._args) {
            if (_args[0]) {
                const [cb] = _args
                _args[0] = (a, el, i, arr) => {
                    const result = cb.call(null, a, el, i, arr)
                    __(el, {
                        type: TYPES.ACCESSOR,
                        scope: null,
                        object: this,
                        access: [i]
                    })
                    return result
                }
            }
            if (!(1 in _args) && 0 in this) {
                __(this[this.length - 1], {
                    type: TYPES.ACCESSOR,
                    scope: null,
                    object: this,
                    access: [this.length - 1]
                })
            }
            return reduceRight.call(this, ..._args)
        }
        Array.prototype.copyWithin = __copyWithin
        Array.prototype.every = __every
        Array.prototype.fill = __fill
        Array.prototype.filter = __filter
        Array.prototype.find = __find
        Array.prototype.findIndex = __findIndex
        Array.prototype.forEach = __forEach
        Array.prototype.includes = __includes
        Array.prototype.indexOf = __indexOf
        Array.prototype.lastIndexOf = __lastIndexOf
        Array.prototype.map = __map
        Array.prototype.reduce = __reduce
        Array.prototype.reduceRight = __reduceRight
        Array.prototype.reverse = __reverse


        return bool => allow = bool
    },
    reset: function () {
        Array.prototype.copyWithin = copyWithin
        Array.prototype.every = every
        Array.prototype.fill = fill
        Array.prototype.filter = filter
        Array.prototype.find = find
        Array.prototype.findIndex = findIndex
        Array.prototype.forEach = forEach
        Array.prototype.includes = includes
        Array.prototype.indexOf = indexOf
        Array.prototype.lastIndexOf = lastIndexOf
        Array.prototype.map = map
        Array.prototype.reduce = reduce
        Array.prototype.reduceRight = reduceRight
        Array.prototype.reverse = reverse
    }
}


function toInteger(arg) {
    let n = Number(arg);
    if (n === Infinity || n === -Infinity) {
        return n;
    }
    return n | 0;
}
    /*
Array.prototype.concat()
Array​.prototype​.copy​Within()
Array​.prototype​.entries()
Array​.prototype​.every()
Array​.prototype​.fill()
Array​.prototype​.filter() X
Array​.prototype​.find()
Array​.prototype​.find​Index()
Array​.prototype​.flat()
Array​.prototype​.flatMap()
Array​.prototype​.for​Each() X
Array​.prototype​.includes()
Array​.prototype​.indexOf()
Array​.prototype​.join()
Array​.prototype​.keys()
Array​.prototype​.last​IndexOf()
Array​.prototype​.map() X
Array​.prototype​.pop()
Array​.prototype​.push()
Array​.prototype​.reduce()X
Array​.prototype​.reduce​Right() X
Array​.prototype​.reverse()
Array​.prototype​.shift()
Array​.prototype​.slice()
Array​.prototype​.some()
Array​.prototype​.sort()
Array​.prototype​.splice()
Array​.prototype​.toLocale​String()
Array​.prototype​.toSource()
Array​.prototype​.toString()
Array​.prototype​.unshift()
Array​.prototype​.values() */