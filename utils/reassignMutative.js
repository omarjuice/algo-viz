const TYPES = require('./types')
const empty = require('./empty')
const { pop, push, unshift, shift, splice, copyWithin, concat, slice, } = Array.prototype
const arrayMethods = { pop, push, unshift, shift, splice, copyWithin }

function reassignMutative(objects, __, defProp, stringify, ignore, allowEmpty) {
    const _concat = function (...args) {
        allowEmpty(true)
        const result = __(concat.call(this, ...args), {
            type: TYPES.EXPRESSION,
            scope: null
        })
        allowEmpty(false)
        return result
    };
    const _slice = function (...args) {
        allowEmpty(true)
        const result = slice.call(this, ...args)
        allowEmpty(false)
        return result
    }
    const _forEach = function (cb, _this) {
        for (let i = 0; i < this.length; i++) {
            ignore(true)
            if (this[i] === empty) {
                continue;
            }
            ignore(false)
            cb.call(_this || null, this[i], i, this)
        }
        ignore(false)
    }
    const _every = function (cb, _this) {
        for (let i = 0; i < this.length; i++) {
            ignore(true)
            if (this[i] === empty) {
                continue;
            }
            ignore(false)
            if (!cb.call(_this || null, this[i], i, this)) return false
        }
        ignore(false)
        return true
    }
    const _some = function (cb, _this) {
        for (let i = 0; i < this.length; i++) {
            ignore(true)
            if (this[i] === empty) {
                continue;
            }
            ignore(false)
            if (cb.call(_this || null, this[i], i, this)) return true
        }
        ignore(false)
        return false
    }
    const _indexOf = function (searchElement, fromIndex) {
        //MDN
        let k;
        let len = this.length >>> 0;
        if (len === 0) {
            return -1;
        }
        let n = fromIndex | 0;
        if (n >= len) {
            return -1;
        }
        k = Math.max(n >= 0 ? n : len - Math.abs(n), 0);
        while (k < len) {
            ignore(true)
            if (k in this && this[k] !== empty) {
                ignore(false)
                if (this[k] === searchElement) {
                    return k
                }
            }
            k++;
        }
        ignore(false)
        return -1;
    }
    const _lastIndexOf = function (searchElement /*, fromIndex*/) {
        // MDN
        let n, k,
            len = this.length >>> 0;
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
            ignore(true)
            if (k in this && this[k] !== empty) {
                ignore(false)
                if (this[k] === searchElement) {
                    return k
                }
            }
        }
        ignore(false)
        return -1;
    }
    const _map = function (cb, _this) {
        const mappedArray = []
        for (let i = 0; i < this.length; i++) {
            ignore(true)
            if (this[i] === empty) {
                continue;
            }
            ignore(false)
            mappedArray.push(cb.call(_this || null, this[i], i, this))
        }
        ignore(false)
        return mappedArray
    }
    const _filter = function (cb, _this) {

        const filteredArray = []
        for (let i = 0; i < this.length; i++) {
            ignore(true)
            if (this[i] === empty) {
                continue;
            }
            ignore(false)
            const val = this[i]
            if (cb.call(_this || null, val, i, this)) {
                filteredArray.push(val)
            }
        }
        ignore(false)
        return filteredArray
    }
    const _reduce = function (cb, acc) {
        let i = 0;
        if (acc === undefined) {
            ignore(true)
            while (i < this.length && this[i] === empty) {
                i++
            }
            if (i === this.length) {
                throw new TypeError('Reduce of empty array with no initial value')
            }
            ignore(false)
            acc = this[i++]
        }

        for (i; i < this.length; i++) {
            ignore(true)
            if (this[i] === empty) {
                continue;
            }
            ignore(false)
            const val = this[i]
            acc = cb.call(null, acc, val, i, this)
        }
        ignore(false)
        return acc
    }
    const _reduceRight = function (cb, acc) {
        let i = this.length - 1;
        if (acc === undefined) {
            ignore(true)
            while (i > -1 && this[i] === empty) {
                i--
            }
            if (i === -1) {
                throw new TypeError('Reduce of empty array with no initial value')
            }
            ignore(false)
            acc = this[i--]
        }

        for (i; i > -1; i--) {
            ignore(true)
            if (this[i] === empty) {
                continue;
            }
            ignore(false)
            const val = this[i]

            acc = cb.call(null, acc, val, i, this)
        }
        ignore(false)
        return acc
    }
    function arrayMutate(method) {
        // specifically methods that change the arrays length
        return function (...args) {
            allowEmpty(true)
            const result = method.call(this, ...args)
            const id = stringify(this)
            const prevLen = objects[id].final
            if (this.length !== prevLen) {
                __(this.length, {
                    type: TYPES.SET,
                    object: id,
                    access: ['length']
                })
            }
            if (prevLen < this.length) {
                for (let i = prevLen, value = this[i]; i < this.length; value = this[++i]) {
                    defProp(this, i, value)
                    this[i] = value
                }

            }

            objects[id].final = this.length
            allowEmpty(false)
            return result
        }
    }
    const _definePropertyParams = {
        enumerable: false,
        writeable: true,
        configurable: true
    }
    function arrayIterate(arr) {
        // includes iterative methods because of the behavior of getters and setters

        Object.defineProperty(arr, 'concat', {
            value: _concat,
            ..._definePropertyParams
        })
        Object.defineProperty(arr, 'slice', {
            value: _slice,
            ..._definePropertyParams
        })
        Object.defineProperty(arr, 'forEach', {
            value: _forEach,
            ..._definePropertyParams
        })
        Object.defineProperty(arr, 'every', {
            value: _every,
            ..._definePropertyParams
        })
        Object.defineProperty(arr, 'some', {
            value: _some,
            ..._definePropertyParams
        })
        Object.defineProperty(arr, 'indexOf', {
            value: _indexOf,
            ..._definePropertyParams
        })
        Object.defineProperty(arr, 'lastIndexOf', {
            value: _lastIndexOf,
            ..._definePropertyParams
        })
        Object.defineProperty(arr, 'map', {
            value: _map,
            ..._definePropertyParams
        })
        Object.defineProperty(arr, 'filter', {
            value: _filter,
            ..._definePropertyParams
        })
        Object.defineProperty(arr, 'reduce', {
            value: _reduce,
            ..._definePropertyParams
        })
        Object.defineProperty(arr, 'reduceRight', {
            value: _reduceRight,
            ..._definePropertyParams
        })
    }
    function mapMutate(obj) {
        let ignore = false
        const { get, has, set, delete: mapDelete, clear, forEach } = obj
        Object.defineProperty(obj, 'get', {
            value: function (key) {
                ignore = true
                const result = this.has(key)
                ignore = false
                if (result) {
                    const val = get.call(this, key)
                    return ignore ? val : __(val, {
                        type: TYPES.GET,

                        object: stringify(this),
                        access: [stringify(key)]
                    })
                } else {
                    return undefined
                }
            },
            ..._definePropertyParams
        })
        Object.defineProperty(obj, 'has', {
            value: function (key) {
                const result = has.call(this, key)
                if (!ignore) {
                    return __(result, {
                        type: TYPES.GET,

                        object: stringify(this),
                        access: [stringify(key)]
                    })
                } else {
                    return result
                }
            },
            ..._definePropertyParams
        })
        Object.defineProperty(obj, 'set', {
            value: function (key, value) {
                const result = set.call(this, key, value)
                __(value, {
                    type: TYPES.SET,
                    object: stringify(this),
                    access: [stringify(key)]
                })
                return result
            },
            ..._definePropertyParams
        })
        Object.defineProperty(obj, 'delete', {
            value: function (key) {
                const result = mapDelete.call(this, key)
                if (result) {
                    __(result, {
                        type: TYPES.DELETE,

                        object: stringify(this),
                        access: [stringify(key)]
                    })
                }
                return result
            },
            ..._definePropertyParams
        })
        Object.defineProperty(obj, 'clear', {
            value: function () {
                clear.call(this)
                __(undefined, {
                    type: TYPES.CLEAR,
                    object: stringify(this),
                })
            },
            ..._definePropertyParams
        })

        Object.defineProperty(obj, 'forEach', {
            value: function (...args) {
                if (args[0]) {
                    const [cb] = args
                    args[0] = (key, val, ..._args) => {
                        __(val, {
                            type: TYPES.GET,

                            object: stringify(this),
                            access: [stringify(key)]
                        })
                        return cb.call(args[1] || null, key, val, ..._args)
                    }
                }
                return forEach.call(this, ...args)
            },
            ..._definePropertyParams
        })
    }
    function setMutate(obj = new Set()) {
        const { has, add, clear, delete: setDelete, forEach } = obj
        Object.defineProperty(obj, 'has', {
            value: function (key) {
                const result = has.call(this, key)
                if (result) {
                    return __(key, {
                        type: TYPES.GET,

                        object: stringify(this),
                        access: [stringify(key)]
                    })
                } else {
                    return result
                }
            },
            ..._definePropertyParams
        })
        Object.defineProperty(obj, 'add', {
            value: function (val) {
                const result = add.call(this, val)
                __(val, {
                    type: TYPES.SET,
                    object: stringify(this),
                    access: [stringify(val)]
                })
                return result
            },
            ..._definePropertyParams
        })
        Object.defineProperty(obj, 'clear', {
            value: function () {
                clear.call(this)
                __(undefined, {
                    type: TYPES.CLEAR,
                    object: stringify(this),
                })
            },
            ..._definePropertyParams
        })
        Object.defineProperty(obj, 'delete', {
            value: function (key) {
                const result = setDelete.call(this, key)
                if (result) {
                    __(result, {
                        type: TYPES.DELETE,

                        object: stringify(this),
                        access: [stringify(key)]
                    })
                }
                return result
            },
            ..._definePropertyParams
        })
        Object.defineProperty(obj, 'forEach', {
            value: function (...args) {
                if (args[0]) {
                    const [cb] = args
                    args[0] = (key, val, ..._args) => {
                        __(val, {
                            type: TYPES.GET,

                            object: stringify(this),
                            access: [stringify(key)]
                        })
                        return cb.call(args[1] || null, key, val, ..._args)
                    }
                }
                return forEach.call(this, ...args)
            },
            ..._definePropertyParams
        })
    }
    return {
        reassignArrayMethods: function (arr) {
            for (const method in arrayMethods) {
                Object.defineProperty(arr, method, {
                    value: arrayMutate(arrayMethods[method]),
                    ..._definePropertyParams
                })
            }
            arrayIterate(arr)

        },
        reassignMapMethods: obj => mapMutate(obj),
        reassignSetMethods: obj => setMutate(obj)
    }

}

module.exports = reassignMutative