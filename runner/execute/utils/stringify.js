const checkTypedArray = require('./checkTypedArray')
// the values are specific to the Runner instance
const natives = require('./natives')
module.exports = function (obj) {
    // these are functions that change instance methods on their respective object tyes
    if (this.map.has(obj)) {
        return this.map.get(obj)
    }
    if (obj && typeof obj === 'object') {
        // we want to ignore native objects

        checkTypedArray(obj)

        if (obj instanceof RegExp || obj instanceof String || obj instanceof Date) return obj.toString()
        if (!Array.isArray(obj)) {
            const objString = obj.toString()
            if (objString.includes(' Iterator') || objString.includes(' Generator')) {
                const id = this.genId(5, 2)
                this.map.set(obj, id)
                this.types[id] = objString
                return id
            }
        }
        let newId = this.genId(5, 3)
        if (this.constructors.has(obj)) {
            const [flag, id] = this.constructors.get(obj)
            if (!flag) return id
            newId = id
            this.constructors.delete(obj)
        }
        this.map.set(obj, newId)
        if (obj instanceof Map) {
            // maps can have object keys, we need to stringify those too.

            // Map & Set virtualization needs a refactor
            const copy = {}
            let i = 0;
            for (const [key, val] of obj.entries()) {
                copy[i++] = [this.stringify(key), this.stringify(val)]
            }
            this.reassignMapMethods(obj)
            this.objects[newId] = copy
        } else if (obj instanceof Set) {
            // same for sets
            const copy = {}
            let i = 0
            for (const value of obj.values()) {
                copy[i++] = this.stringify(value)
            }
            this.reassignSetMethods(obj)
            this.objects[newId] = copy
        } else if (Array.isArray(obj)) {
            // we store arrays as hashes, they will be easier to modify when the visualizer consumes the data
            const copy = {}
            for (let i = 0; i < obj.length; i++) {
                let val = obj[i]

                copy[i] = !(i in obj) ? null : this.stringify(val)
                if (i in obj) {
                    obj[i] = this.virtualize(val)
                }
            }
            copy.length = obj.length
            this.objects[newId] = copy
        } else {
            const copy = {}
            for (const key in obj) {
                if (key[0] === '_') continue;
                copy[key] = this.stringify(obj[key])
                obj[key] = this.virtualize(obj[key])
            }
            this.objects[newId] = copy
        }
        let type = obj.constructor.name
        if (this.Viz && this.Viz[type] && this.Viz[type] === obj.constructor) type = 'Viz.' + type
        this.types[newId] = type
        return newId
    } else {
        // these falsy primitives must be encoded because they all become `null` in JSON
        if (typeof obj === 'function') {
            if (this.map.has(obj)) return this.map.get(obj)
            const name = obj.name && obj.name[0] !== '_' ? obj.name : 'function'
            let id;
            while (!id || (id in this.objects)) {
                id = this.genId(5, natives.has(name) ? 4 : 2)
            }
            this.types[id] = `[Function: ${name}]`
            this.map.set(obj, id)
            return id
        } else if (typeof obj === 'symbol') {
            return obj.toString()
        }
        return obj
    }
}



