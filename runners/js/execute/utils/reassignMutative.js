const TYPES = require('./types')

function reassignMutative() {
    const runner = this;

    const _definePropertyParams = {
        enumerable: false,
        writeable: true,
        configurable: true
    }

    function mapMutate(obj) {
        let ignore = false
        const { get, has, set, delete: mapDelete, clear, forEach } = obj
        Object.defineProperty(obj, 'get', {
            value: function (key) {
                const result = obj.has(key)
                if (result) {
                    const val = get.call(obj, key)
                    return ignore ? val : runner.__(val, {
                        type: TYPES.GET,

                        object: runner.stringify(obj),
                        access: runner.stringify(key)
                    })
                } else {
                    return undefined
                }
            },
            ..._definePropertyParams
        })
        Object.defineProperty(obj, 'set', {
            value: function (key, value) {
                const result = set.call(obj, key, value)
                runner.__(value, {
                    type: TYPES.SET,
                    object: runner.stringify(obj),
                    access: runner.stringify(key)
                })
                return result
            },
            ..._definePropertyParams
        })
        Object.defineProperty(obj, 'delete', {
            value: function (key) {
                const result = mapDelete.call(obj, key)
                if (result) {
                    runner.__(result, {
                        type: TYPES.DELETE,

                        object: runner.stringify(obj),
                        access: runner.stringify(key)
                    })
                }
                return result
            },
            ..._definePropertyParams
        })
        Object.defineProperty(obj, 'clear', {
            value: function () {
                clear.call(obj)
                runner.__(undefined, {
                    type: TYPES.CLEAR,
                    object: runner.stringify(obj),
                })
            },
            ..._definePropertyParams
        })

        Object.defineProperty(obj, 'forEach', {
            value: function (...args) {
                if (args[0]) {
                    const [cb] = args
                    args[0] = (val, key, ..._args) => {
                        runner.__(val, {
                            type: TYPES.GET,

                            object: runner.stringify(obj),
                            access: runner.stringify(key)
                        })
                        return cb.call(args[1] || null, val, key, ..._args)
                    }
                }
                return forEach.call(obj, ...args)
            },
            ..._definePropertyParams
        })
    }
    function setMutate(obj) {
        const { has, add, clear, delete: setDelete, forEach } = obj
        Object.defineProperty(obj, 'has', {
            value: function (key) {
                const result = has.call(obj, key)
                if (result) {
                    return runner.__(result, {
                        type: TYPES.GET,
                        object: runner.stringify(obj),
                        access: runner.stringify(key)
                    })
                } else {
                    return result
                }
            },
            ..._definePropertyParams
        })
        Object.defineProperty(obj, 'add', {
            value: function (val) {
                const result = add.call(obj, val)
                runner.__(val, {
                    type: TYPES.SET,
                    object: runner.stringify(obj),
                    access: runner.stringify(val)
                })
                return result
            },
            ..._definePropertyParams
        })
        Object.defineProperty(obj, 'clear', {
            value: function () {
                clear.call(obj)
                runner.__(undefined, {
                    type: TYPES.CLEAR,
                    object: runner.stringify(obj),
                })
            },
            ..._definePropertyParams
        })
        Object.defineProperty(obj, 'delete', {
            value: function (key) {
                const result = setDelete.call(obj, key)
                if (result) {
                    runner.__(result, {
                        type: TYPES.DELETE,
                        object: runner.stringify(obj),
                        access: runner.stringify(key)
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
                        runner.__(val, {
                            type: TYPES.GET,

                            object: runner.stringify(obj),
                            access: runner.stringify(key)
                        })
                        return cb.call(args[1] || null, key, val, ..._args)
                    }
                }
                return forEach.call(obj, ...args)
            },
            ..._definePropertyParams
        })
    }
    return {
        reassignMapMethods: obj => mapMutate(obj),
        reassignSetMethods: obj => setMutate(obj)
    }

}

module.exports = reassignMutative