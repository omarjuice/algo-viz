const randomString = require('./randomString')
const isNative = require('./isNative')
module.exports = function ({ map = new Map(), objects = {}, types = {} }) {
    return function stringify(obj) {
        if (obj && typeof obj === 'object') {
            if (isNative(obj)) return obj.constructor.name
            if (obj instanceof RegExp || obj instanceof String) return obj.toString()
            if (map.has(obj)) {
                return map.get(obj)
            }
            let newId = '___' + randomString(5)
            while (map.has(newId)) {
                newId = '___' + randomString(5)
            }
            map.set(obj, newId)

            if (obj instanceof Map) {
                // should map copies be ordered ?
                const copy = {}
                for (const entry of obj.entries()) {
                    const [key, val] = entry
                    let newKey = key
                    if (key && typeof key === 'object' && !(key instanceof RegExp || key instanceof String)) {
                        newKey = stringify(key)
                    }
                    copy[newKey] = stringify(val)
                }
                objects[newId] = copy
            } else if (obj instanceof Set) {
                const copy = {}
                for (let value of obj.values()) {
                    if (value && typeof value === 'object' && !(value instanceof RegExp || value instanceof String)) {
                        value = stringify(value)
                    }
                    copy[value] = value
                }
                objects[newId] = copy
            } else {
                const copy = Array.isArray(obj) ? [...obj] : { ...obj }
                for (const key in copy) {
                    copy[key] = stringify(obj[key])
                }
                objects[newId] = copy
            }

            types[newId] = obj.constructor.name
            return newId
        } else {
            if (typeof obj === 'undefined') {
                return 'undefined'
            } else if (typeof obj === 'function') {
                return obj.name && obj.name[0] !== '_' ? obj.name : 'function'
            } else if (typeof obj === 'symbol') {
                return obj.toString()
            }
            return obj
        }
    }
}



