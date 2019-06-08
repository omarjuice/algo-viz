
const stringify = require('./utils/stringify')
const TYPES = require('./utils/types')
const randomString = require('./utils/randomString')
const defineProperty = require('./utils/defineProperty')
const isArray = require('./utils/isArray')


class Runner {
    constructor(name) {
        // The bucket for capturing steps to be used for visualization
        this.steps = []
        // keeps references of objects and their generated id's
        this.map = new Map()
        // the actual objects, with flattened references
        this.objects = {}
        // the constructors of objects
        this.types = {}
        // callStack for determining the type of function we are currently in
        this.callStack = []
        // a unique signature solely for preventing Object.defineProperty from throwing an error if it was called by the Runner or stringify()
        this.signature = require('./utils/signature')
        // a wrapper for Object.defineProperty that gives it the signature
        this.defProp = (obj, key, value) => {
            Object.defineProperty(obj, key, { value }, this.signature)
        }
        // a function used to flatten object references into JSONable structures, we pass it those values to avoid repetition
        this.stringify = stringify({ map: this.map, objects: this.objects, types: this.types, __: this.__.bind(this), defProp: this.defProp })
        // resets hijacked native methods
        this.reset = defineProperty(this.__.bind(this), this.stringify, this.map)
        this.name = name
        // types that will have an object property
        this.objectTypes = [TYPES.PROP_ASSIGNMENT, TYPES.METHODCALL, TYPES.SPREAD, TYPES.DELETE, TYPES.ACCESSOR, TYPES.SET, TYPES.GET, TYPES.METHOD]
        // a flag that will ignore info while set to true
        this.ignore = false

        // keeping references to literal values because `undefined` is not JSONable and null is used as an empty value
        const undefLiteral = '_' + randomString(5)
        const nullLiteral = '_' + randomString(5)
        const nanLiteral = '_' + randomString(5)
        this.map.set('undefined', undefLiteral)
        this.map.set('null', nullLiteral)
        this.map.set('NaN', nanLiteral)
        this.objects[undefLiteral] = 'undefined'
        this.objects[nullLiteral] = 'null'
        this.objects[nanLiteral] = 'NaN'
    }


    __(val, info) {
        // main
        if (this.ignore) return val


        if ([TYPES.FUNC, TYPES.METHOD, TYPES.RETURN].includes(info.type)) {
            this._f(val, info)
        }
        if ([TYPES.ASSIGNMENT, TYPES.PROP_ASSIGNMENT].includes(info.type) && info.update) {
            info.value += info.update
        }


        // is the currently executing function a constructor ?
        // if so, we want to ignore any assignments/ accessors of the constructor's object until the constructor has finished running
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
                // we dont actually care about those types
                this.steps.push(info)
            }
        }
        return val
    }

    _f(val, info) {
        // for function invocations and returns
        if (info.type === TYPES.RETURN) {
            this.callStack.pop()
        } else {
            this.callStack.push(info)
        }
    }

    _p(val, info) {
        let obj = info.object
        this.ignore = true
        //traverse accessors
        for (let i = 0; i < info.access.length - 1; i++) {
            obj = obj[info.access[i]]
        }
        const id = this.map.get(obj)
        const prop = info.access[info.access.length - 1]
        const objIsArray = isArray(obj)
        this.ignore = false
        if (!Object.getOwnPropertyDescriptor(obj, prop).get) {
            if (!objIsArray) {
                this.defProp(obj, prop, val)
            } else {
                // because an arrays length can change if an assignment is given to an element beyond its length
                // we must traverse the array to give getters and setters for all of the indices
                const length = this.objects[id].final;
                if (obj.length > length) {
                    for (let i = length, el = obj[i]; i < obj.length; i++) {
                        this.defProp(obj, i, el)
                    }
                    this.__(obj.length, {
                        type: TYPES.SET,
                        scope: null,
                        object: this.map.get(obj),
                        access: ['length']
                    })
                }

            }
            obj[prop] = val
        }
    }
}


module.exports = Runner


