const stepify = require('./stepify')
const babel = require('@babel/core')
const fs = require('fs')
const stringify = require('./utils/stringify')
const configEnv = require('./utils/setup')
const TYPES = require('./utils/types')

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
const arr = [new Int32Array(10).fill(1), new Int8Array(10).fill(1)]
const func = `

function init(x) {
    print(x) && init(x-1)
}
init(5)

`
class Runner {
    constructor(name) {
        this.steps = []
        this.map = new Map()
        this.objects = {}
        this.types = {}
        this.refs = {}
        this.scopeStack = [0]
        this.callStack = []
        this.stringify = stringify({ map: this.map, objects: this.objects, types: this.types })
        this.allow = null
        this.name = name
        this.callSt
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
        if ([TYPES.ASSIGNMENT, TYPES.DECLARATION, TYPES.RETURN, TYPES.BLOCK].includes(info.type) && info.scope) {
            const [parent, scope] = info.scope
            while (this.scopeStack[this.scopeStack.length - 1] !== parent) {
                this.scopeStack.pop()
            }
            if (info.type !== TYPES.RETURN) this.scopeStack.push(scope)
        }
        if ([TYPES.FUNC, TYPES.RETURN].includes(info.type)) {
            if (info.type === TYPES.FUNC) {
                this.callStack.push(info.name)
            } else {
                this.callStack.pop()
            }
            console.log(this.callStack);
        }
        if ([TYPES.ASSIGNMENT, TYPES.PROP_ASSIGNMENT].includes(info.type) && info.update) {
            info.value += info.update
        }
        this.steps.push(info)
        this.allow && this.allow(true)
        return val
    }
}

const randomString = (l = 3) => {
    let id = (Math.random() * 26 + 10 | 0).toString(36)
    for (let i = 1; i < l; i++)
        id += (Math.random() * 26 | 0).toString(36)
    return id
}


const input = { _name: null, references: {} }
const { code } = babel.transformSync(func, {
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
console.log('NUMBER OF STEPS ', global[_name].steps.length);
console.log(input)
fs.writeFileSync('executed.json', JSON.stringify({
    steps: global[_name].steps,
    objects: global[_name].objects,
    refs: global[_name].refs,
    types: global[_name].types
}))


