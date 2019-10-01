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

        //record of already virtualized objects so each unique object has only one virtualized version
        this.proxies = new Map()
        this.types = {}

        this.objectIndex = {}

        // callStack for determining the type of function we are currently in
        this.calls = 0

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
        this.types[negInfinity] = '-Infinity';

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


        if ([TYPES.FUNC, TYPES.METHOD].includes(info.type)) {
            this.calls++
        }
        if (info.type === TYPES.RETURN) {
            this.calls--
        }
        if ([TYPES.DELETE, TYPES.SET, TYPES.GET].includes(info.type)) {
            info.object = this.stringify(info.object)
        }
        info.value = this.stringify(val)
        if ([TYPES.FUNC, TYPES.METHOD, TYPES.BLOCK, TYPES.RETURN].includes(info.type)) {
            const prev = this.steps[this.steps.length - 1];
            if (this.steps.length > 0) {
                if (!('batch' in prev)) {
                    prev.batch = [info]
                } else {
                    prev.batch.push(info)
                    if (prev.batch.length > this.limit) throw new Error('Step limit of 30000 exceeded')
                }
            }
        } else {
            this.steps.push(info)
        }
        if (this.steps.length > this.limit) throw new Error('Step limit of 30000 exceeded')
        if (this.calls > 500) throw new Error('Maximum callstack size of 500 exceeded')
        return this.virtualize(val)
    }


}


module.exports = Runner


