const TYPES = require('./types')
const signature = require('./signature')
module.exports = function (__, stringify, map) {
    const { defineProperty, defineProperties } = Object
    Object.defineProperty = function (o, p, attributes, sig) {
        try {
            if (map.has(o)) {
                let { enumerable, configurable, writable, value, get, set } = attributes
                let getFlag = true
                if (enumerable || enumerable === undefined) {

                    if (typeof get === 'function') {
                        attributes.get = () => {
                            const result = get.bind(o)()
                            return getFlag ? __(result, {
                                type: TYPES.GET,
                                scope: null,
                                object: stringify(o),
                                access: [p],
                            }) : result
                        }

                    } else {
                        attributes.get = () => {
                            return getFlag ? __(value, {
                                type: TYPES.GET,
                                scope: null,
                                object: stringify(o),
                                access: [p],
                            }) : value
                        }
                    }
                    if ((writable || configurable) || (writable === undefined && configurable === undefined)) {

                        if (typeof set === 'function') {
                            attributes.set = (val) => {
                                set.bind(o)(val)
                                getFlag = false
                                __(attributes.get(), {
                                    type: TYPES.SET,
                                    scope: null,
                                    object: stringify(o),
                                    access: [p],
                                })
                                getFlag = true
                            }
                        } else {
                            attributes.set = val => __(value = val, {
                                type: TYPES.SET,
                                scope: null,
                                object: stringify(o),
                                access: [p],
                            })
                        }
                    }
                    delete attributes.value
                    delete attributes.enumerable
                    delete attributes.writable
                    if (!(p in o)) {
                        __(value, {
                            type: TYPES.SET,
                            scope: null,
                            object: stringify(o),
                            access: [p],
                        })
                    }
                }


            }

            return defineProperty.call(null, o, p, attributes)
        } catch (e) {
            if (sig === signature) {
                console.log(e);
            } else {
                throw e
            }
        }

    }
    Object.defineProperties = function (o, props) {
        for (let key in props) {
            Object.defineProperty(o, key, props[key])
        }
        return o
    }
    return () => Object.defineProperty = defineProperty
}