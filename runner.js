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
        this.val = 0
        this.notCircular = { hello: true }
        this.arr = [1, 2, 3, this.notCircular]
        this.arrContainer = [this.arr]
    }
}
const print = (val) => {
    console.log(val)
    return val
}
const obj = new Set()
obj.add([1, 2])
obj.add({ key: 'value' })
const func = `

function init(){
    let a = 1
    {
        let b = 2
    }
    {
        {
            let c = 3
        }
    }
    for(let d = 4; d < 5; ++d){
        let e = 5
    }
    second()
}
function second(){
    let f = 6
}
init()

`
class Runner {
    constructor() {
        this.steps = []
        this.map = new Map()
        this.objects = {}
        this.types = {}
        this.refs = {}
        this.scopeStack = [0]
        this.stringify = stringify({ map: this.map, objects: this.objects, types: this.types })
    }
    __(val, info) {
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
            console.log(info.scope);
            while (this.scopeStack[this.scopeStack.length - 1] !== parent) {
                this.scopeStack.pop()
            }
            if (info.type !== TYPES.RETURN) this.scopeStack.push(scope)
        }
        if ([TYPES.ASSIGNMENT, TYPES.PROP_ASSIGNMENT].includes(info.type) && info.update) {
            info.value += info.update
        }
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
    ],
    parserOpts: {
        strictMode: true
    }
})
fs.writeFileSync('transpiled.js', code)


global[_name] = new Runner()

eval(code)
// console.log(code)
console.log('NUMBER OF STEPS ', global[_name].steps.length);
fs.writeFileSync('executed.json', JSON.stringify({
    steps: global[_name].steps,
    objects: global[_name].objects,
    refs: global[_name].refs,
    types: global[_name].types
}))


