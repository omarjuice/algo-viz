const TYPES = require('./types')
function virtualize(object) {
    const runner = this
    if (!object || typeof object !== 'object') return object
    if (
        object instanceof Map ||
        object instanceof Set ||
        object instanceof String ||
        object instanceof RegExp ||
        object instanceof Date ||
        object instanceof Error
    ) {
        return object
    }
    if (this.proxies.has(object)) {
        return this.proxies.get(object)[0]
    }
    const isArray = Array.isArray(object)
    if (!isArray) {
        const objString = object.toString()
        if (objString.includes(' Iterator') || objString.includes(' Generator')) return object
    }
    const proxy = isArray ? virtualizeArray(object, runner) : virtualizeObject(object, runner)
    this.proxies.set(object, [proxy, false])
    this.proxies.set(proxy, [proxy, true])
    if (this.map.has(object)) {
        this.map.set(proxy, this.map.get(object))
    } else {
        if (this.constructors.has(object)) {
            const [, id] = this.constructors.get(object)
            this.map.set(proxy, id)
        } else {
            const id = this.stringify(object)
            this.map.set(proxy, id)
        }
    }
    return proxy
}

function isVirtualProperty(object, property) {
    const definition = Reflect.getOwnPropertyDescriptor(object, property)
    return !!definition && typeof property !== 'symbol' && property[0] !== '_'
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

            if (isVirtualProperty(target, prop))
                runner.__(val, {
                    type: TYPES.GET,
                    object,
                    access: [prop]
                })
            return val
        },
        set(target, prop, value) {

            target[prop] = runner.virtualize(value)
            if (isVirtualProperty(target, prop))
                runner.__(target[prop], {
                    type: TYPES.SET,
                    object,
                    access: [prop]
                })
            return true
        },
        deleteProperty(target, prop) {
            if (!isVirtualProperty(target, prop)) return delete target[prop]
            return runner.__(delete target[prop], {
                type: TYPES.DELETE,
                object,
                access: [prop]
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
                        access: [prop]
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
            const isVirtual = typeof prop === 'number' && prop >= 0 && prop < target.length
            if (isVirtual) {
                runner.__(val, {
                    type: TYPES.GET,
                    object,
                    access: [prop]
                })
            }
            return val
        },
        set(target, prop, value) {
            prop = convert(prop)
            if (prop === 'last') {
                prop = target.length - 1
            }

            target[prop] = runner.virtualize(value)
            const isVirtual = (typeof prop === 'number' && prop >= 0 && prop < target.length) || prop === 'length'
            if (isVirtual)
                runner.__(target[prop], {
                    type: TYPES.SET,
                    object,
                    access: [prop]
                })
            return true
        },
        deleteProperty(target, prop) {
            prop = convert(prop)
            const isVirtual = typeof prop === 'number' && prop >= 0 && prop < target.length
            if (!isVirtual) return delete target[prop]
            return runner.__(delete target[prop], {
                type: TYPES.DELETE,
                object,
                access: [prop]
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
                        access: [convert(prop)]
                    })
                }
            }
            return defined
        }
    })
}


module.exports = virtualize