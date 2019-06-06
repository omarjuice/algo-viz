const stepify = require('./stepify')
const babel = require('@babel/core')
const fs = require('fs')
const stringify = require('./utils/stringify')
const configEnv = require('./utils/setup')
const TYPES = require('./utils/types')
const stepIterator = require('./stepIterator')
const randomString = require('./utils/randomString')
const print = v => { return console.log(v), v };


const func = `
const arr = [1,2,3,4,5]
const arr2 = arr.find(el =>  el === 3)
  

    
`
class Runner {
    constructor(name) {
        this.steps = []
        this.map = new Map()
        this.objects = {}
        this.types = {}
        this.stringify = stringify({ map: this.map, objects: this.objects, types: this.types })
        this.callStack = []
        this.allow = null
        this.name = name
        const undefLiteral = '_' + randomString(5)
        const nullLiteral = '_' + randomString(5)
        this.map.set('undefined', undefLiteral)
        this.map.set('null', nullLiteral)
        this.objects[undefLiteral] = 'undefined'
        this.objects[nullLiteral] = 'null'
    }
    __(val, info) {
        this.allow && this.allow(false)
        const objectTypes = [TYPES.PROP_ASSIGNMENT, TYPES.METHODCALL, TYPES.ACTION, TYPES.SPREAD, TYPES.DELETE, TYPES.ACCESSOR, TYPES.ITERATE]
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
                info.object = this.stringify(info.object)
                this.callStack.push(info)
            }
        }
        if ([TYPES.ASSIGNMENT, TYPES.PROP_ASSIGNMENT].includes(info.type) && info.update) {
            info.value += info.update
        }
        const currentFunc = this.callStack[this.callStack.length - 1]
        const isConstructor = currentFunc && currentFunc.type === TYPES.METHOD && currentFunc.kind === 'constructor'
        if (!(isConstructor && objectTypes.concat([TYPES.DECLARATION]).includes(info.type) && info.object === currentFunc.object)) {
            if (objectTypes.includes(info.type)) {
                info.object = this.stringify(info.object)
            }
            info.value = this.stringify(val)
            this.steps.push(info)
        }
        this.allow && this.allow(true)
        return val
    }
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
const { identifiers } = stepIterator(global[_name].steps, {})
// console.log(identifiers);
fs.writeFileSync('executed.json', JSON.stringify({
    steps: global[_name].steps,
    objects: global[_name].objects,
    types: global[_name].types
}))


