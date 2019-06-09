const TYPES = require('./types')
const { pop, push, unshift, shift, splice } = Array.prototype
const arrayMethods = { pop, push, unshift, shift, splice }

function reassignMutative(objects, __, defProp, stringify) {

    function arrayMutate(method) {
        // specifically methods that change the arrays length
        return function (...args) {
            const result = method.call(this, ...args)
            const id = stringify(this)
            const prevLen = objects[id].final
            if (this.length !== prevLen) {
                __(this.length, {
                    type: TYPES.SET,
                    object: stringify(this),
                    access: ['length']
                })
            }
            if (prevLen < this.length) {
                for (let i = prevLen, value = this[i]; i < this.length; value = this[++i]) {
                    value = this[i]
                    defProp(this, i, value)
                    this[i] = value
                }

            }
            objects[id].final = this.length
            return result
        }
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
            enumerable: false
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
            enumerable: false
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
            enumerable: false
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
            enumerable: false
        })
        Object.defineProperty(obj, 'clear', {
            value: function () {
                clear.call(this)
                __(undefined, {
                    type: TYPES.CLEAR,
                    object: stringify(this),
                })
            },
            enumerable: false
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
            enumerable: false
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
            enumerable: false
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
            enumerable: false
        })
        Object.defineProperty(obj, 'clear', {
            value: function () {
                clear.call(this)
                __(undefined, {
                    type: TYPES.CLEAR,
                    object: stringify(this),
                })
            },
            enumerable: false
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
            enumerable: false
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
            enumerable: false
        })
    }
    return {
        reassignArrayMethods: function (arr) {
            for (const method in arrayMethods) {
                Object.defineProperty(arr, method, {
                    value: arrayMutate(arrayMethods[method]),
                    enumerable: false
                })
            }
        },
        reassignMapMethods: obj => mapMutate(obj),
        reassignSetMethods: obj => setMutate(obj)
    }

}

module.exports = reassignMutative