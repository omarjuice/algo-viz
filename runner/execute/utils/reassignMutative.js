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
                const result = this.has(key)
                if (result) {
                    const val = get.call(this, key)
                    return ignore ? val : runner.__(val, {
                        type: TYPES.GET,

                        object: runner.stringify(this),
                        access: [runner.stringify(key)]
                    })
                } else {
                    return undefined
                }
            },
            ..._definePropertyParams
        })
        Object.defineProperty(obj, 'set', {
            value: function (key, value) {
                const result = set.call(this, key, value)
                runner.__(value, {
                    type: TYPES.SET,
                    object: runner.stringify(this),
                    access: [runner.stringify(key)]
                })
                return result
            },
            ..._definePropertyParams
        })
        Object.defineProperty(obj, 'delete', {
            value: function (key) {
                const result = mapDelete.call(this, key)
                if (result) {
                    runner.__(result, {
                        type: TYPES.DELETE,

                        object: runner.stringify(this),
                        access: [runner.stringify(key)]
                    })
                }
                return result
            },
            ..._definePropertyParams
        })
        Object.defineProperty(obj, 'clear', {
            value: function () {
                clear.call(this)
                runner.__(undefined, {
                    type: TYPES.CLEAR,
                    object: runner.stringify(this),
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

                            object: runner.stringify(this),
                            access: [runner.stringify(key)]
                        })
                        return cb.call(args[1] || null, val, key, ..._args)
                    }
                }
                return forEach.call(this, ...args)
            },
            ..._definePropertyParams
        })
    }
    function setMutate(obj) {
        const { has, add, clear, delete: setDelete, forEach } = obj
        Object.defineProperty(obj, 'has', {
            value: function (key) {
                const result = has.call(this, key)
                if (result) {
                    return runner.__(result, {
                        type: TYPES.GET,
                        object: runner.stringify(this),
                        access: [runner.stringify(key)]
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
                runner.__(val, {
                    type: TYPES.SET,
                    object: runner.stringify(this),
                    access: [runner.stringify(val)]
                })
                return result
            },
            ..._definePropertyParams
        })
        Object.defineProperty(obj, 'clear', {
            value: function () {
                clear.call(this)
                runner.__(undefined, {
                    type: TYPES.CLEAR,
                    object: runner.stringify(this),
                })
            },
            ..._definePropertyParams
        })
        Object.defineProperty(obj, 'delete', {
            value: function (key) {
                const result = setDelete.call(this, key)
                if (result) {
                    runner.__(result, {
                        type: TYPES.DELETE,
                        object: runner.stringify(this),
                        access: [runner.stringify(key)]
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

                            object: runner.stringify(this),
                            access: [runner.stringify(key)]
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
        reassignMapMethods: obj => mapMutate(obj),
        reassignSetMethods: obj => setMutate(obj)
    }

}

module.exports = reassignMutative