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
                const copy = {
                    keys: {},
                    vals: []
                }
                for (const entry of obj.entries()) {
                    const [key, val] = entry
                    let newKey = key
                    if (key && typeof key === 'object' && !(key instanceof RegExp || key instanceof String)) {
                        newKey = stringify(key)
                    }
                    let newVal = stringify(val)
                    copy.keys[newKey] = copy.vals.length
                    copy.vals.push([newKey, newVal])
                }
                objects[newId] = copy
            } else if (obj instanceof Set) {
                const copy = {
                    keys: {},
                    vals: []
                }
                for (let value of obj.values()) {
                    if (value && typeof value === 'object' && !(value instanceof RegExp || value instanceof String)) {
                        value = stringify(value)
                    }
                    copy.keys[value] = copy.vals.length
                    copy.vals.push(value)
                }
                objects[newId] = copy
            } else {
                const copy = isArray(obj) ? [...obj] : { ...obj }
                for (const key in copy) {
                    copy[key] = stringify(obj[key])
                }
                objects[newId] = copy
            }

            types[newId] = obj.constructor.name
            return newId
        } else {
            if (obj === undefined) {
                return map.get('undefined')
            } else if (obj === null) {
                return map.get('null')
            } else if (typeof obj === 'function') {
                return obj.name && obj.name[0] !== '_' ? obj.name : 'function'
            } else if (typeof obj === 'symbol') {
                return obj.toString()
            }
            return obj
        }
    }
}

const isArray = (obj) => Array.isArray(obj) || ['Int8Array',
    'Uint8Array',
    'Int16Array',
    'Uint16Array',
    'Int32Array',
    'Uint32Array',
    'Float32Array',
    'Float64Array'].includes(obj.constructor.name)

