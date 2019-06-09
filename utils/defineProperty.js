const TYPES = require('./types')
const signature = require('./signature')
const empty = require('./empty')
module.exports = function (__, stringify, map, objects) {
    // reassign all object mutative methods
    const { defineProperty, defineProperties, assign } = Object
    Object.defineProperty = function (o, p, attributes, sig) {
        //signature is a custom param that prevents errors from being thrown when this function is called by the Runner
        try {
            // do we need a signature here
            if (map.has(o)) {
                let { enumerable, configurable, writable, value, get, set } = attributes
                let getFlag = true
                // we may want to get the value but not show that we did, so we use this flag.
                if (enumerable || enumerable === undefined) {
                    if (typeof get === 'function') {
                        // we wrap the input get function
                        attributes.get = () => {
                            const result = get.bind(o)()
                            return getFlag ? __(result, {
                                type: TYPES.GET,
                                object: stringify(o),
                                access: [p],
                            }) : result
                        }

                    } else {
                        // else we use our own
                        attributes.get = () => {
                            return getFlag ? __(value, {
                                type: TYPES.GET,
                                object: stringify(o),
                                access: [p],
                            }) : value
                        }
                    }
                    if ((writable || configurable) || (writable === undefined && configurable === undefined)) {
                        //same as get
                        if (typeof set === 'function') {
                            attributes.set = (val) => {
                                set.bind(o)(val)
                                getFlag = false
                                __(attributes.get(), {
                                    type: TYPES.SET,
                                    object: stringify(o),
                                    access: [p],
                                })
                                getFlag = true
                                return val
                            }
                        } else {
                            //important empty symbol for array accessing with the `in` operator or through
                            // `for in` iteration or otherwise anything that acceses the array by keys and not by indices
                            // does NOT work for spread operators and iterative array methods, the value actually becomes undefined
                            // but it is there...
                            attributes.set = val => {
                                if (value === empty || (value !== empty && val === empty)) {
                                    Object.defineProperty(o, p, {
                                        value: val
                                    }, signature)
                                    return
                                }

                                return __(value = val, {
                                    type: TYPES.SET,
                                    object: stringify(o),
                                    access: [p],
                                })
                            }
                        }
                    }
                    delete attributes.value
                    delete attributes.enumerable
                    delete attributes.writable
                    if (typeof configurable !== 'boolean') attributes.configurable = true
                    if (value === empty) {
                        attributes.enumerable = false
                    } else {
                        attributes.enumerable = true
                    }
                    // if weve seen the object before we want to know what was set
                    if (!(p in o) && map.get(o) in objects) {
                        console.log(p, value)
                        __(value, {
                            type: TYPES.SET,
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
        if (map.has(o)) {
            for (let key in props) {
                Object.defineProperty(o, key, props[key])
            }
            return o
        } else {
            return defineProperties.call(null, o, props)
        }
    }
    Object.assign = function (object, ...sources) {
        if (map.has(object)) {
            while (sources.length) {
                const current = sources.shift()
                if (current && typeof current === 'object') {
                    for (const key in current) {
                        Object.defineProperty(object, key, {
                            value: current[key]
                        })
                    }
                }
            }
            return object
        } else {
            return assign.call(null, object, ...sources)
        }
    }
    return () => {
        Object.defineProperty = defineProperty;
        Object.assign = assign
        Object.defineProperties = defineProperties
    }
}