const stepify = require('../stepify')
const babel = require('@babel/core')
const fs = require('fs')
const stringify = require('../utils/stringify')
const configEnv = require('../utils/setup')
const TYPES = require('../utils/types')
const stepIterator = require('../stepIterator')
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
const func = `
function init(){
    {{{{{{{let i = 0}}}}}}}
}
init()


`
async function main(program) {
    class Runner {
        constructor(name) {
            this.steps = []
            this.map = new Map()
            this.objects = {}
            this.types = {}
            this.stringify = stringify({ map: this.map, objects: this.objects, types: this.types })
            this.allow = null
            this.name = name
        }
        __(val, info) {
            this.allow && this.allow(false)
            if ([TYPES.CALL, TYPES.METHODCALL].includes(info.type)) {
                const id = this.stringify(info.arguments)
                info.arguments = this.objects[id]
                delete this.objects[id]
                delete this.types[id]
            }
            if ([TYPES.PROP_ASSIGNMENT, TYPES.METHODCALL, TYPES.SPREAD, TYPES.DELETE, TYPES.ACCESSOR].includes(info.type)) {
                info.object = this.stringify(info.object)
            }
            info.value = this.stringify(val)



            if ([TYPES.ASSIGNMENT, TYPES.PROP_ASSIGNMENT].includes(info.type) && info.update) {
                info.value += info.update
            }
            this.steps.push(info)
            this.allow && this.allow(true)
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
    global[_name].allow = configEnv.setup(_name)

    eval(code)
    configEnv.reset()
    const { steps, objects, types } = global[_name]
    fs.writeFileSync('executed.json', JSON.stringify({
        steps,
        objects,
        types
    }))
    delete global[_name]
    return { steps, objects, types }
}
describe('Code Runner', () => {
    test('Runner does not throw', async () => {
        expect(async () => await main(func)).not.toThrow()
    })
    test('Returns steps, objects, and types', async () => {
        const { steps, objects, types } = await main(func)
        expect(Array.isArray(steps) && steps.length > 0).toBe(true)
        expect(typeof objects).toBe('object')
        expect(typeof types).toBe('object')
    })
    test('stack algorithm', async () => {
        const { steps, objects, types } = await main(func)
        const scopeStack = [null]
        const callStack = []
        const scopeChain = {}
        const identifiers = {}
        const funcScopes = {}
        const calls = {}
        fs.writeFileSync('states.json', '')
        stepIterator(steps, { scopeChain, scopeStack, callStack, identifiers, funcScopes, calls })


    })
})