module.exports = function (obj) {

    if (this.map.has(obj)) {
        return this.map.get(obj)
    }
    if (obj && typeof obj === 'object' && !(obj instanceof (this.global ? this.global.RegExp : RegExp)) && !(obj instanceof (this.global ? this.global.Date : Date))) {
        // we want to ignore native objects
        this.checkBanned(obj)
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
        if (obj instanceof (this.global ? this.global.Map : Map)) {
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
        } else if (obj instanceof (this.global ? this.global.Set : Set)) {
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
            const isBaseObject = obj.constructor === this.global.Object
            for (const key in obj) {
                if (key[0] === '_' && !isBaseObject) continue;
                const def = Reflect.getOwnPropertyDescriptor(obj, key)
                if (!def) {
                    continue;
                }
                copy[key] = this.stringify(obj[key])
                if (def.get && !def.set) continue;
                obj[key] = this.virtualize(obj[key])
            }
            this.objects[newId] = copy
        }

        let type = obj.constructor.name
        if (!type) {
            this.throw(new Error('Class name not found. All classes must have a name.'))
        }
        if (
            obj instanceof (this.global ? this.global.String : String)

        ) {
            type = 'Object'
        }
        if (this.Viz && this.Viz[type] && this.Viz[type] === obj.constructor) type = 'Viz.' + type
        this.types[newId] = type
        return newId
    } else {
        if (typeof obj === 'function') {
            if (this.map.has(obj)) return this.map.get(obj)
            const name = obj.name && obj.name[0] !== '_' ? obj.name : 'function'
            let id = this.genId(5, 2)
            this.types[id] = `[Function: ${name}]`
            this.map.set(obj, id)
            return id
        } else if (typeof obj === 'symbol' || obj instanceof (this.global ? this.global.RegExp : RegExp) || obj instanceof (this.global ? this.global.Date : Date)) {
            let id = this.genId(5, 5)
            this.types[id] = obj.toString()
            this.map.set(obj, id)
            return id
        }


        return obj
    }
}



