const randomString = require('./randomString')
const isNative = require('./isNative')
const isArray = require('./isArray')
const reassignMutative = require('./reassignMutative')
const empty = require('./empty')
// the values are specific to the Runner instance
module.exports = function ({ map = new Map(), objects = {}, types = {}, defProp, __, genId }) {
    // these are functions that change instance methods on their respective object tyes
    const { reassignArrayMethods, reassignMapMethods, reassignSetMethods } = reassignMutative(objects, __, defProp, stringify)
    function stringify(obj) {
        if (obj && typeof obj === 'object') {
            // we want to ignore native objects
            const native = isNative(obj)
            if (native) {
                return native
            }
            if (obj instanceof RegExp || obj instanceof String || obj instanceof Date) return obj.toString()
            if (map.has(obj)) {
                return map.get(obj)
            }
            const newId = genId(5, 3)
            map.set(obj, newId)

            if (obj instanceof Map) {
                // maps can have object keys, we need to stringify those too.
                const copy = {}
                for (const entry of obj.entries()) {
                    const [key, val] = entry
                    let newKey = key
                    if (key && typeof key === 'object' && !(key instanceof RegExp || key instanceof String)) {
                        newKey = stringify(key)
                    }
                    let newVal = stringify(val)
                    copy[newKey] = newVal
                }
                reassignMapMethods(obj)
                objects[newId] = copy
            } else if (obj instanceof Set) {
                // same for sets
                const copy = {}
                for (let value of obj.values()) {
                    if (value && typeof value === 'object' && !(value instanceof RegExp || value instanceof String)) {
                        value = stringify(value)
                    }
                    copy[value] = value
                }
                reassignSetMethods(obj)
                objects[newId] = copy
            } else if (isArray(obj)) {
                // we store arrays as objects, they will be easier to modify when the visualizer consumes the data
                const copy = {}
                for (let i = 0; i < obj.length; i++) {
                    let val = obj[i]
                    // we use a symbol to represent empty so that the `in` operator returns the proper value
                    if (!(i in obj)) {
                        val = empty
                    }
                    copy[i] = stringify(val)
                    defProp(obj, i, val)
                }
                copy.length = obj.length
                copy.final = obj.length
                if (Array.isArray(obj)) {
                    reassignArrayMethods(obj)
                }
                objects[newId] = copy
            } else {
                const copy = {}
                for (const key in obj) {
                    copy[key] = stringify(obj[key])
                    defProp(obj, key, obj[key])
                }
                objects[newId] = copy
            }

            types[newId] = obj.constructor.name
            return newId
        } else {
            // these falsy primitives must be encoded because they all become `null` in JSON
            if (obj === undefined) {
                return map.get('undefined')
            } else if (obj === null) {
                return map.get('null')
            } else if (Number.isNaN(obj)) {
                return map.get('NaN')
            } else if (obj === empty) {
                return map.get(empty)
            } else if (typeof obj === 'function') {
                if (map.has(obj)) return map.get(obj)
                const native = isNative(obj)
                if (native) return native
                const name = obj.name && obj.name[0] !== '_' ? obj.name : 'function'
                let id;
                while (!id || (id in objects)) {
                    id = '__' + randomString(5)
                }
                objects[id] = `[Function: ${name}]`
                map.set(obj, id)
                return id
            } else if (typeof obj === 'symbol') {
                return obj.toString()
            }
            return obj
        }
    }
    return stringify
}



