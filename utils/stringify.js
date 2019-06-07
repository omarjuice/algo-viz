const randomString = require('./randomString')
const isNative = require('./isNative')
const isArray = require('./isArray')
module.exports = function ({ map = new Map(), objects = {}, types = {}, defProp }) {
    function stringify(obj) {
        if (obj && typeof obj === 'object') {
            if (isNative(obj)) return obj.constructor.name
            if (obj instanceof RegExp || obj instanceof String) return obj.toString()
            if (map.has(obj)) {
                return map.get(obj)
            }
            let newId = '___' + randomString(5)
            while (newId in objects) {
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
            } else if (isArray(obj)) {
                const copy = {}
                for (let i = 0; i < obj.length; i++) {
                    copy[i] = stringify(obj[i])
                    defProp(obj, i, obj[i])
                }
                copy.length = obj.length
                copy.final = obj.length
                objects[newId] = copy
            } else {
                const copy = { ...obj }
                for (const key in copy) {
                    copy[key] = stringify(obj[key])

                    defProp(obj, key, obj[key])
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
    return stringify
}



