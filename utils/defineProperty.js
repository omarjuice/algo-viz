const TYPES = require('./types')
const signature = require('./signature')
module.exports = function (__, stringify, map) {
    const { defineProperty } = Object
    Object.defineProperty = function (o, p, attributes, sig) {
        try {
            if (map.has(o)) {
                let { enumerable, configurable, writable, value, get, set } = attributes
                let getFlag = true
                if (p === 'l') {
                    console.log(p, attributes)
                }
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
    return () => Object.defineProperty = defineProperty
}