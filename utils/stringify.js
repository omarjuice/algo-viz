const randomString = require('./randomString')
const isNative = require('./isNative')
function stringify({ obj, map = new Map(), objects = {}, types = {} }) {
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
                    newKey = stringify({ obj: key, map, objects })
                }
                copy[newKey] = stringify({ obj: val, map, objects })
            }
            objects[newId] = copy
        } else {
            const copy = Array.isArray(obj) ? [...obj] : { ...obj }
            for (const key in copy) {
                copy[key] = stringify({ obj: obj[key], map, objects, types })
            }
            objects[newId] = copy
        }

        if (objects[newId]) {
            console.log(objects[newId]);
            types[newId] = obj.constructor.name
        }
        return newId
    } else {
        if (typeof obj === 'boolean') {
            return String(obj)
        } else if (typeof obj === 'undefined') {
            return 'undefined'
        } else if (typeof obj === 'function') {
            return obj.name && obj.name[0] !== '_' ? obj.name : 'function'
        } else if (typeof obj === 'symbol') {
            return obj.toString()
        }
        return obj
    }
}

module.exports = stringify

