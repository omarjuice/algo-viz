const stringify = require('./utils/stringify')
const TYPES = require('./utils/types')
const randomString = require('./utils/randomString')
const reassignMutative = require('./utils/reassignMutative')
const virtualize = require('./utils/virtualize')
class Runner {
    constructor(name, code, limit = 30000) {
        this.limit = limit
        this.code = code
        // The bucket for capturing steps to be used for visualization
        this.steps = []
        // keeps references of objects and their generated id's
        this.map = new Map()

        // the actual objects that will be consumed by the visualizer, with flattened references
        this.objects = {}

        // the constructors of objects, used to skip stringification until the object is intantiated
        this.constructors = new Map()

        //record of already virtualized objects so each unique object has only one virtualized version
        this.proxies = new Map()
        this.types = {}
        // callStack for determining the type of function we are currently in
        this.callStack = []

        this.virtualize = virtualize

        this.genId = (l = 3, num_ = 2) => {
            let id;
            while (!id || id in this.objects) id = '_'.repeat(num_) + randomString(l)
            return id
        }

        const { reassignMapMethods, reassignSetMethods } = reassignMutative.call(this)
        this.reassignMapMethods = reassignMapMethods;
        this.reassignSetMethods = reassignSetMethods

        // a function used to flatten object references into JSONable structures, we pass it those values to avoid repetition
        this.stringify = stringify.bind(this)

        this.name = name

        // types that will have an object property
        this.objectTypes = [TYPES.PROP_ASSIGNMENT, TYPES.METHODCALL, TYPES.DELETE, TYPES.SET, TYPES.GET, TYPES.METHOD, TYPES.IN]


        // keeping references to literal values because they are  not JSONable and `null` is used as an empty value
        const undefLiteral = this.genId(5, 1)
        this.map.set(undefined, undefLiteral)
        this.types[undefLiteral] = 'undefined'
        const nullLiteral = this.genId(5, 1)
        this.map.set(null, nullLiteral)
        this.types[nullLiteral] = 'null'
        const nanLiteral = this.genId(5, 1)
        this.map.set(NaN, nanLiteral)
        this.types[nanLiteral] = 'NaN'
        const infinity = this.genId(5, 1)
        this.map.set(Infinity, infinity)
        this.types[infinity] = 'Infinity'
        const negInfinity = this.genId(5, 1)
        this.map.set(-Infinity, negInfinity)
        this.types[negInfinity] = '-Infinity'

        //Will not catch steps when this is true
        this._ignore = false
        this.ignore = (bool) => this._ignore = bool
    }


    __(val, info) {
        // main
        if (this._ignore) return val
        if (info.type === TYPES.THIS) {
            return this.virtualize(val)
        }
        if (info.type === TYPES.EXPRESSION || info.type === TYPES.CALL) {
            const call = this.callStack[this.callStack.length - 1]
            if (call && call.type === TYPES.METHOD && call.kind === 'constructor') {
                return this.virtualize(val)
            }
        }
        if ([TYPES.FUNC, TYPES.METHOD, TYPES.RETURN].includes(info.type)) {
            this._f(info)
        }
        if ([TYPES.ASSIGNMENT].includes(info.type) && info.update) {
            info.value += info.update
        }

        if ([TYPES.DELETE, TYPES.SET, TYPES.GET].includes(info.type)) {

            if (this.constructors.has(info.object)) {
                const [allow] = this.constructors.get(info.object)
                info.object = this.stringify(info.object)
                if (!allow) return this.virtualize(val)
            }
            info.object = this.stringify(info.object)
        }
        info.value = this.stringify(val)
        if ([TYPES.FUNC, TYPES.METHOD, TYPES.BLOCK, TYPES.RETURN].includes(info.type)) {
            const prev = this.steps[this.steps.length - 1];
            if (!('batch' in prev)) {
                prev.batch = [info]
            } else {
                prev.batch.push(info)
            }
        } else {
            this.steps.push(info)
        }
        if (this.steps.length > this.limit) throw new Error('Step limit of 30000 exceeded')
        if (this.callStack.length > 500) throw new Error('Maximum callstack size of 500 exceeded')
        return this.virtualize(val)
    }

    _f(info) {
        // for function invocations and returns
        // is the currently executing function a constructor ?
        // if so, we want to avoid stringifying the object until the constructor has finished running

        if (info.type === TYPES.RETURN) {
            const call = this.callStack.pop()
            if (call.type === TYPES.METHOD) {
                if (call.kind === 'constructor') {
                    const [, id] = this.constructors.get(call.object)
                    this.constructors.set(call.object, [true, id])
                    this.constructors.set(this.virtualize(call.object), [true, id])
                }
                call.object = this.stringify(call.object)
            }
        } else {
            if (info.type === TYPES.METHOD) {
                if (info.kind === 'constructor') {
                    const id = this.genId(5, 3)
                    this.constructors.set(info.object, [false, id])
                    this.constructors.set((this.virtualize), [false, id])
                }
            }
            this.callStack.push(info)
        }
    }


}


module.exports = Runner


