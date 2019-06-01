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
const print = (val) => console.log(val)
// const obj = new Map()
// obj.set([1, 2], [3, 4])
// obj.set({ key: 'value' }, { a: 'z' })
const arr = [1, 2, 3]
const func = `

function init(){
    const obj = arr.slice()
    const obj2 = obj.slice()
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
        this._stringifierOpts = { map: this.map, objects: this.objects, types: this.types }
    }
    __(val, info) {
        if ([TYPES.CALL, TYPES.METHODCALL].includes(info.type)) {
            const id = stringify({ obj: info.arguments, ...this._stringifierOpts })
            info.arguments = this.objects[id]
            delete this.objects[id]
            delete this.types[id]
        }
        if ([TYPES.PROP_ASSIGNMENT, TYPES.METHODCALL, TYPES.SPREAD, TYPES.DELETE, TYPES.ACCESSOR].includes(info.type)) {
            info.object = stringify({ obj: info.object, ...this._stringifierOpts })
        }
        info.value = stringify({ obj: val, ...this._stringifierOpts })
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
        // console.log(info.name, info.value)
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
    refs: global[_name].refs,
    types: global[_name].types
}))
fs.writeFileSync('transpiled.js', code)


