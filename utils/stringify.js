const randomString = require('./randomString')
module.exports = function stringify({ obj, map = new Map(), objects = {} }) {
    if (obj && typeof obj === 'object') {
        if (obj instanceof RegExp) return obj.toString()
        if (obj instanceof String) return obj.toString()
        if (map.has(obj)) return map.get(obj)
        const copy = Array.isArray(obj) ? [...obj] : { ...obj }
        let newId = '___' + randomString(5)
        while (map.has(newId)) {
            newId = '___' + randomString(5)
        }
        map.set(obj, newId)
        for (const key in copy) {
            copy[key] = stringify({ obj: obj[key], map, objects })
        }
        objects[newId] = copy
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



