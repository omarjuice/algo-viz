const stepify = require('../stepify')
const babel = require('@babel/core')
const fs = require('fs')
const stringify = require('../utils/stringify')
const TYPES = require('../utils/types')
const stepIterator = require('../stepIterator')
const randomString = require('../utils/randomString')
const defineProperty = require('../utils/defineProperty')
const isArray = require('../utils/isArray')
const mutative = require('../utils/mutative')
const funcs = require('./funcs')
class Circular {
    constructor() {
        this.value = this
        this.array = [this]
        this.object = { value: this }
        this.object.obj = this.object
        this.val = 0
        this.notCircular = { hello: true }
        this.arr = [1, 2, 3, this.notCircular]
        this.arrContainer = [this.arr]
    }
}
const print = (val) => {
    // console.log(val)
    return val
}
async function main(program) {
    class Runner {
        constructor(name) {
            this.steps = []
            this.map = new Map()
            this.objects = {}
            this.types = {}
            this.signature = require('../utils/signature')
            this.defProp = (obj, key, value) => {
                Object.defineProperty(obj, key, { value }, this.signature)
            }
            this.stringify = stringify({ map: this.map, objects: this.objects, types: this.types, __: this.__.bind(this), defProp: this.defProp })
            this.reset = defineProperty(this.__.bind(this), this.stringify, this.map)
            this.callStack = []
            this.allow = null
            this.name = name

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
            const objectTypes = [TYPES.PROP_ASSIGNMENT, TYPES.METHODCALL, TYPES.SPREAD, TYPES.DELETE, TYPES.ACCESSOR, TYPES.SET, TYPES.GET, TYPES.METHOD]
            if ([TYPES.CALL, TYPES.METHODCALL, TYPES.ACTION].includes(info.type)) {
                if (info.arguments) {
                    const id = this.stringify(info.arguments)
                    info.arguments = this.objects[id]
                    delete this.objects[id]
                    delete this.types[id]
                }
            }

            if ([TYPES.FUNC, TYPES.METHOD, TYPES.RETURN].includes(info.type)) {
                if (info.type === TYPES.RETURN) {
                    this.callStack.pop()
                } else {
                    this.callStack.push(info)
                }
            }
            if ([TYPES.ASSIGNMENT, TYPES.PROP_ASSIGNMENT].includes(info.type) && info.update) {
                info.value += info.update
            }

            if (info.type === TYPES.METHODCALL) {
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
                            for (let i = prevLen, val = obj[i]; i < obj.length; val = obj[++i]) {
                                val = obj[i]
                                this.defProp(obj, i, val)
                                obj[i] = val
                            }

                        }
                        this.objects[id].final = obj.length
                    }
                }
                this.ignore = false
            }
            const currentFunc = this.callStack[this.callStack.length - 1]
            const isConstructor = currentFunc && currentFunc.type === TYPES.METHOD && currentFunc.kind === 'constructor'
            if (!(isConstructor && objectTypes.concat([TYPES.DECLARATION]).includes(info.type) && info.object === currentFunc.object)) {
                if (info.type === TYPES.PROP_ASSIGNMENT) {
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
                if (objectTypes.includes(info.type)) {
                    info.object = this.stringify(info.object)
                }
                // console.log('BEFORE : ,', val)
                info.value = this.stringify(val)
                // console.log('AFTER: ', info.value)
                if (![TYPES.ACCESSOR, TYPES.PROP_ASSIGNMENT].includes(info.type)) {
                    this.steps.push(info)
                }
            }
            // console.log(info.type, info.name)
            return val
        }
    }

    const input = { _name: null, references: {} }
    const { code } = await babel.transformAsync(program, {
        plugins: [
            ['@babel/plugin-transform-destructuring', { loose: true }],
            ['@babel/plugin-transform-parameters', { loose: true }],
            'babel-plugin-transform-remove-console',
            [stepify(input), {
                disallow: {
                    async: true,
                    generator: true
                },
            }]
        ],
        parserOpts: {
            strictMode: true
        }
    })
    fs.writeFileSync('transpiled.js', code)
    const { _name } = input

    global[_name] = new Runner(_name)

    eval(code)
    const { steps, objects, types } = global[_name]
    fs.writeFileSync('executed.json', JSON.stringify({
        steps,
        objects,
        types
    }))
    delete global[_name]
    return { steps, objects, types }
}

async function testRunner(func) {

    const { steps, objects, types } = await main(func)
    expect(Array.isArray(steps) && steps.length > 0).toBe(true)
    expect(typeof objects).toBe('object')
    expect(typeof types).toBe('object')
    const scopeStack = [null]
    const callStack = []
    const scopeChain = {}
    const identifiers = {}
    const funcScopes = {}
    const calls = {}
    stepIterator(steps, { scopeChain, scopeStack, callStack, identifiers, funcScopes, calls })


}
for (let func in funcs) {
    test('RUNNER ' + func, async () => {
        await testRunner(funcs[func])
    })
}