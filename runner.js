const stepify = require('./stepify')
const babel = require('@babel/core')
const fs = require('fs')
const stringify = require('./utils/stringify')
const configEnv = require('./utils/setup')
const TYPES = require('./utils/types')
const stepIterator = require('./stepIterator')

const print = v => v

const func = `

function init(x){
    var val = print(x)
    {
        var d = val + 1
        {
            {
                var g = val + 3
                let z = 1
            }
        }
    }
    var f = val + 4
    
 }
 init(1)


`
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


