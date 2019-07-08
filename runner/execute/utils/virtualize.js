const TYPES = require('./types')
const isNative = require('./isNative')
function virtualize(object) {
    const runner = this
    if (!object || typeof object !== 'object') return object
    if (isNative(object) || object instanceof Map ||
        object instanceof Set ||
        object instanceof String ||
        object instanceof RegExp ||
        object instanceof Date) {
        return object
    }

    if (this.proxies.has(object)) {
        return this.proxies.get(object)[0]
    }
    const proxy = new Proxy(object, {
        get(target, prop) {
            if (!(prop in target)) return undefined
            const val = target[prop]

            if (isVirtualProperty(target, prop))
                runner.__(val, {
                    type: TYPES.GET,
                    object,
                    access: [convert(prop)]
                })
            return val
        },
        set(target, prop, value) {
            target[prop] = value
            if (isVirtualProperty(target, prop))
                runner.__(target[prop], {
                    type: TYPES.SET,
                    object,
                    access: [convert(prop)]
                })
            return true
        },
        deleteProperty(target, prop) {
            if (!isVirtualProperty(target, prop)) return delete target[prop]
            return runner.__(delete target[prop], {
                type: TYPES.DELETE,
                object,
                access: [convert(prop)]
            })
        },
    })
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
    const definition = Object.getOwnPropertyDescriptor(object, property)
    if (Array.isArray(object)) {
        const prop = convert(property)
        if (typeof prop === 'number') {
            if (prop > -1 && prop < object.length) return true
        }
    }
    return !!definition && typeof property !== 'symbol'
}
function convert(val) {
    if (typeof val !== 'string') return val
    const number = Number(val)
    return !Number.isNaN(number) ? number : val
}





module.exports = virtualize