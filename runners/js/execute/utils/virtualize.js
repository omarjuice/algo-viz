const TYPES = require('./types')
function virtualize(object) {
    if (object === this) return undefined;
    const runner = this
    if (!object || typeof object !== 'object') return object

    if (
        object === runner.global ||
        object instanceof (runner.global ? runner.global.Map : Map) ||
        object instanceof (runner.global ? runner.global.Set : Set) ||
        object instanceof (runner.global ? runner.global.String : String) ||
        object instanceof (runner.global ? runner.global.RegExp : RegExp) ||
        object instanceof (runner.global ? runner.global.Date : Date)
    ) {
        return object
    }

    if (runner.proxies.has(object)) {
        return runner.proxies.get(object)[0]
    }
    const isArray = Array.isArray(object)
    if (!isArray) {
        const objString = object.toString()
        if (objString.includes(' Iterator') || objString.includes(' Generator')) return object
    }
    const proxy = isArray ? virtualizeArray(object, runner) : virtualizeObject(object, runner)
    runner.proxies.set(object, [proxy, false])
    runner.proxies.set(proxy, [proxy, true])
    if (runner.map.has(object)) {
        runner.map.set(proxy, this.map.get(object))
    } else {

        const id = runner.stringify(object)
        runner.map.set(proxy, id)

    }
    return proxy
}

function isVirtualProperty(object, property, runner) {
    const isBaseObject = object.constructor === runner.global.Object
    const definition = Reflect.getOwnPropertyDescriptor(object, property)
    return !!definition && typeof property !== 'symbol' && (isBaseObject || property[0] !== '_') && definition.enumerable === true
}
function convert(val) {
    if (typeof val !== 'string') return val
    const number = Number(val)
    return !Number.isNaN(number) ? number : val
}


function virtualizeObject(object, runner) {
    return new Proxy(object, {
        get(target, prop) {
            if (!(prop in target)) return undefined
            if (prop === Symbol.iterator) {
                return target[Symbol.iterator].bind(target);
            }
            const val = target[prop]

            if (isVirtualProperty(target, prop, runner))
                runner.__(val, {
                    type: TYPES.GET,
                    object,
                    access: prop
                })
            return val
        },
        set(target, prop, value) {

            target[prop] = runner.virtualize(value)
            if (isVirtualProperty(target, prop, runner))
                runner.__(target[prop], {
                    type: TYPES.SET,
                    object,
                    access: prop
                })
            return true
        },
        deleteProperty(target, prop) {
            if (!isVirtualProperty(target, prop, runner)) return delete target[prop]
            return runner.__(delete target[prop], {
                type: TYPES.DELETE,
                object,
                access: prop
            })
        },
        defineProperty(target, prop, descriptor) {
            descriptor.value = runner.virtualize(descriptor.value)
            const defined = Reflect.defineProperty(target, prop, descriptor)
            if (defined) {
                const definition = Reflect.getOwnPropertyDescriptor(target, prop)
                if (definition.enumerable && typeof prop !== 'symbol') {
                    runner.__(target[prop], {
                        type: TYPES.SET,
                        object,
                        access: prop
                    })
                }
            }
            return defined
        }
    })
}

function virtualizeArray(object, runner) {
    return new Proxy(object, {
        get(target, prop) {
            prop = convert(prop)
            if (prop === 'last') {
                prop = target.length - 1
            }
            const val = target[prop]
            const isVirtual = Number.isInteger(prop) && prop >= 0 && prop < target.length
            if (isVirtual) {
                runner.__(val, {
                    type: TYPES.GET,
                    object,
                    access: prop
                })
            }
            return val
        },
        set(target, prop, value) {
            prop = convert(prop)
            if (prop === 'last') {
                prop = target.length - 1
            }
            const len = target.length;
            target[prop] = runner.virtualize(value)
            const isNumber = Number.isInteger(prop);
            const isVirtual = (isNumber && prop >= 0) || prop === 'length'
            if (len !== target.length) {
                runner.__(target.length, {
                    type: TYPES.SET,
                    object,
                    access: 'length'
                })
            }
            if (isVirtual)
                runner.__(target[prop], {
                    type: TYPES.SET,
                    object,
                    access: prop
                })
            return true
        },
        deleteProperty(target, prop) {
            prop = convert(prop)
            const isVirtual = Number.isInteger(prop) && prop >= 0 && prop < target.length
            if (!isVirtual) return delete target[prop]
            return runner.__(delete target[prop], {
                type: TYPES.DELETE,
                object,
                access: prop
            })
        },
        defineProperty(target, prop, descriptor) {
            prop = convert(prop)
            descriptor.value = runner.virtualize(descriptor.value)
            const defined = Reflect.defineProperty(target, prop, descriptor)
            if (defined) {
                const definition = Reflect.getOwnPropertyDescriptor(target, prop)
                if (definition.enumerable && typeof prop === 'number') {
                    runner.__(target[prop], {
                        type: TYPES.SET,
                        object,
                        access: prop
                    })
                }
            }
            return defined
        }
    })
}


module.exports = virtualize