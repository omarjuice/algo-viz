const checkTypedArray = require('./checkTypedArray')
const natives = require('./natives')
module.exports = function (obj) {
    if (this.map.has(obj)) {
        return this.map.get(obj)
    }
    if (obj && typeof obj === 'object') {
        // we want to ignore native objects
        checkTypedArray(obj)
        //Typed arrays cannot be virtualized :(

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

        this.map.set(obj, newId)
        if (!this.objectIndex[this.steps.length]) {
            this.objectIndex[this.steps.length] = []
        };
        this.objectIndex[this.steps.length].push(newId)
        if (obj.constructor.name === 'Map') {
            // maps can have object keys, we need to stringify those too.

            // Map & Set virtualization needs a refactor
            const copy = {}
            let i = 0;
            for (const [key, val] of obj.entries()) {
                copy[i++] = [this.stringify(key), this.stringify(val)]
            }
            // these are functions that change instance methods on their respective object tyes

            this.reassignMapMethods(obj)
            this.objects[newId] = copy
        } else if (obj.constructor.name === 'Set') {
            // same for sets
            const copy = {}
            let i = 0
            for (const value of obj.values()) {
                copy[i++] = this.stringify(value)
            }
            // these are functions that change instance methods on their respective object tyes
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
                const def = Reflect.getOwnPropertyDescriptor(obj, key)

                copy[key] = this.stringify(obj[key])
                if (def.get && !def.set) continue;
                obj[key] = this.virtualize(obj[key])
            }
            this.objects[newId] = copy
        }

        let type = obj.constructor.name
        if (obj instanceof RegExp || obj instanceof String || obj instanceof Date) {
            type = 'Object'
        }
        if (this.Viz && this.Viz[type] && this.Viz[type] === obj.constructor) type = 'Viz.' + type
        this.types[newId] = type
        return newId
    } else {
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



