const stepify = require('./stepify')
const babel = require('@babel/core')
const fs = require('fs')
const stringify = require('./utils/stringify')
const TYPES = require('./utils/types')

class Circular {
    constructor() {
        this.value = this
        this.array = [this]
        this.object = { value: this }
        this.object.obj = this.object
        this.val = 'VALUE'
        this.notCircular = { hello: true }
        this.arr = [1, 2, 3, this.notCircular]
        this.arrContainer = [this.arr]
    }
}
const print = (val) => console.log(val)
const func = `

function init(){
    const circle = new Circular
    for(let i = 0; i < circle.arr.length; i++){
        let val = 2
    }
}

init()

`

class Runner {
    constructor() {
        this.steps = []
        this.map = new Map()
        this.objects = {}
        this.refs = {}
        this.scopeStack = [0]
    }
    __(val, info) {
        if ([TYPES.CALL, TYPES.METHODCALL].includes(info.type)) {
            const id = stringify({ obj: info.arguments, map: this.map, objects: this.objects })
            info.arguments = this.objects[id]
            delete this.objects[id]
        }
        if ([TYPES.PROP_ASSIGNMENT, TYPES.METHODCALL, TYPES.SPREAD, TYPES.DELETE, TYPES.ACCESSOR].includes(info.type)) {
            info.object = stringify({ obj: info.object, map: this.map, objects: this.objects })
        }
        info.value = stringify({ obj: val, map: this.map, objects: this.objects })
        if ([TYPES.ASSIGNMENT, TYPES.DECLARATION, TYPES.RETURN].includes(info.type) && info.scope) {
            const [parent, scope] = info.scope
            while (this.scopeStack[this.scopeStack.length - 1] !== parent) {
                this.scopeStack.pop()
            }
            if (info.type !== TYPES.RETURN) this.scopeStack.push(scope)
        }
        if ([TYPES.ASSIGNMENT, TYPES.PROP_ASSIGNMENT].includes(info.type) && info.update) {
            info.value += info.update
        }
        console.log(info.name, info.value)
        this.steps.push(info)
        return val
    }
}

const randomString = (l = 3) => {
    let id = (Math.random() * 26 + 10 | 0).toString(36)
    for (let i = 1; i < l; i++)
        id += (Math.random() * 26 | 0).toString(36)
    return id
}
const _name = '__' + randomString()


const { code } = babel.transformSync(func, {
    plugins: [
        ['@babel/plugin-transform-destructuring', { loose: true }],
        ['@babel/plugin-transform-parameters', { loose: true }],
        'babel-plugin-transform-remove-console',
        [stepify, {
            disallow: {
                async: true,
                generator: true
            },
            spyName: _name
        }]
    ]
})

global[_name] = new Runner()

eval(code)
// console.log(code)
console.log('NUMBER OF STEPS ', global[_name].steps.length);
fs.writeFileSync('executed.json', JSON.stringify({
    steps: global[_name].steps,
    objects: global[_name].objects,
    refs: global[_name].refs
}))
fs.writeFileSync('transpiled.js', code)


