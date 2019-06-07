
const stringify = require('./utils/stringify')
const TYPES = require('./utils/types')
const randomString = require('./utils/randomString')
const defineProperty = require('./utils/defineProperty')
const isArray = require('./utils/isArray')
const mutative = require('./utils/mutative')


class Runner {
    constructor(name) {
        this.steps = []
        this.map = new Map()
        this.objects = {}
        this.types = {}
        this.signature = require('./utils/signature')
        this.defProp = (obj, key, value) => {
            Object.defineProperty(obj, key, { value }, this.signature)
        }
        this.stringify = stringify({ map: this.map, objects: this.objects, types: this.types, __: this.__.bind(this), defProp: this.defProp })
        this.reset = defineProperty(this.__.bind(this), this.stringify, this.map)
        this.callStack = []
        this.name = name
        this.objectTypes = [TYPES.PROP_ASSIGNMENT, TYPES.METHODCALL, TYPES.SPREAD, TYPES.DELETE, TYPES.ACCESSOR, TYPES.SET, TYPES.GET, TYPES.METHOD]
        this.ignore = false
        const undefLiteral = '_' + randomString(5)
        const nullLiteral = '_' + randomString(5)
        this.map.set('undefined', undefLiteral)
        this.map.set('null', nullLiteral)
        this.objects[undefLiteral] = 'undefined'
        this.objects[nullLiteral] = 'null'
    }


    __(val, info) {
        if (this.ignore) return val

        if ([TYPES.CALL, TYPES.METHODCALL, TYPES.ACTION].includes(info.type)) {
            this._c(val, info)
        }

        if ([TYPES.FUNC, TYPES.METHOD, TYPES.RETURN].includes(info.type)) {
            this._f(val, info)
        }
        if ([TYPES.ASSIGNMENT, TYPES.PROP_ASSIGNMENT].includes(info.type) && info.update) {
            info.value += info.update
        }

        if (info.type === TYPES.METHODCALL) {
            this._m(val, info)
        }
        const currentFunc = this.callStack[this.callStack.length - 1]
        const isConstructor = currentFunc && currentFunc.type === TYPES.METHOD && currentFunc.kind === 'constructor'
        if (!(isConstructor && this.objectTypes.concat([TYPES.DECLARATION]).includes(info.type) && info.object === currentFunc.object)) {
            if (info.type === TYPES.PROP_ASSIGNMENT) {
                this._p(val, info)
            }
            if (this.objectTypes.includes(info.type)) {
                info.object = this.stringify(info.object)
            }
            info.value = this.stringify(val)
            if (![TYPES.ACCESSOR, TYPES.PROP_ASSIGNMENT].includes(info.type)) {
                this.steps.push(info)
            }
        }
        return val
    }
    _c(val, info) {
        if (info.arguments) {
            const id = this.stringify(info.arguments)
            info.arguments = this.objects[id]
            delete this.objects[id]
            delete this.types[id]
        }
    }
    _f(val, info) {
        if (info.type === TYPES.RETURN) {
            this.callStack.pop()
        } else {
            this.callStack.push(info)
        }
    }
    _m(val, info) {
        let obj = info.object
        this.ignore = true
        for (let i = 0; i < info.access.length - 1; i++) {
            obj = obj[info.access[i]]
        }
        if (obj && isArray(obj)) {
            const id = this.map.get(obj)
            const method = info.access[info.access.length - 1]
            if (obj[method] === mutative[method]) {
                const prevLen = this.objects[id].final
                this.ignore = false
                if (obj.length !== prevLen) {
                    this.__(obj.length, {
                        type: TYPES.SET,
                        scope: null,
                        object: this.map.get(obj),
                        access: ['length']
                    })
                }
                if (prevLen < obj.length) {
                    for (let i = prevLen, value = obj[i]; i < obj.length; value = obj[++i]) {
                        value = obj[i]
                        this.defProp(obj, i, value)
                        obj[i] = value
                    }

                }
                this.objects[id].final = obj.length
            }
        }
        this.ignore = false
    }
    _p(val, info) {
        let obj = info.object
        this.ignore = true
        for (let i = 0; i < info.access.length - 1; i++) {
            obj = obj[info.access[i]]
        }
        const id = this.map.get(obj)
        const prop = info.access[info.access.length - 1]
        const objIsArray = isArray(obj)
        if (!(info.access[info.access.length - 1] in this.objects[id])) {
            if (!objIsArray) {
                this.defProp(obj, prop, val)
            } else {
                const length = this.objects[id].length;
                if (obj.length > length) {
                    for (let i = length, el = obj[i]; i < obj.length; i++) {
                        this.defProp(obj, i, el)
                    }
                    this.ignore = false
                    this.__(obj.length, {
                        type: TYPES.SET,
                        scope: null,
                        object: this.map.get(obj),
                        access: ['length']
                    })
                }

            }
            this.ignore = false
            obj[prop] = val
        }
        this.ignore = false
    }
}


module.exports = Runner


