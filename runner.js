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
const arr = new Array(3).fill('x').map((_, i) => 100 - i)
const func = `

function init(x) {
   { let y = x
    {let k = x
        y--;
        print(x) && init(y)
    }
   }
}

init(5)



`
class Runner {
    constructor(name) {
        this.steps = []
        this.map = new Map()
        this.objects = {}
        this.types = {}
        this.scopeStack = [null, 0] //TEMPORARY
        this.callStack = [] // TEMPORARY
        this.scopeChain = { '0': { parent: null, children: [] } } //TEMPORARY
        this.identifiers = {}
        this.funcScopes = {}
        this.calls = {}
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

        if (info.scope) {
            const [parent, scope] = info.scope
            if (!(scope in this.identifiers)) {
                this.identifiers[scope] = {}
            }
            if (!(scope in this.scopeChain)) {
                this.scopeChain[scope] = { parent, children: [] }
                if (parent !== null) {
                    this.scopeChain[parent].children.push(scope)
                }
            }
            const stack = this.scopeStack
            let funcParent = this.scopeChain[scope].parent
            while (funcParent && !(funcParent in this.funcScopes)) {
                funcParent = this.scopeChain[funcParent].parent
            }
            if (stack[stack.length - 1] !== scope) {
                while (stack.length && (stack[stack.length - 1] !== parent && stack[stack.length - 1] !== scope)) {
                    const discardedScope = stack.pop()
                    if (funcParent) {
                        const name = this.funcScopes[funcParent]
                        if (this.calls[name] <= 1) {
                            delete this.identifiers[discardedScope]
                        }
                    }
                }
                if (info.type !== TYPES.RETURN && stack[stack.length - 1] !== scope) stack.push(scope)

            }
            // console.log(this.scopeStack);
        }
        if ([TYPES.ASSIGNMENT, TYPES.DECLARATION].includes(info.type) && info.scope && info.name) {
            const { name, scope: [_, scope] } = info
            if (info.type === TYPES.DECLARATION) {
                if (!this.identifiers[scope][name]) {
                    this.identifiers[scope][name] = []
                }
                this.identifiers[scope][name].push(info.value)
            } else if (info.type === TYPES.ASSIGNMENT) {
                let vals = this.identifiers[scope][name]
                while (!vals) {
                    const { parent } = this.scopeChain[scope]
                    vals = this.identifiers[parent][name]
                }
                if (vals) {
                    vals[vals.length - 1] = val
                }
            }
        }

        if ([TYPES.FUNC, TYPES.RETURN].includes(info.type)) {
            if (info.type === TYPES.FUNC) {
                this.callStack.push(info.name)
                if (!this.calls[info.name]) this.calls[info.name] = 0
                this.calls[info.name]++
                // ---------
                this.funcScopes[info.scope[1]] = info.name
                // ---------
            } else {
                this.callStack.pop()
                const queue = [info.scope[1]]
                while (queue.length) {
                    const scope = queue.shift()
                    const identifiers = this.identifiers[scope]
                    for (const id in identifiers) {
                        identifiers[id].pop()
                    }
                    const { children } = this.scopeChain[scope]
                    for (const child of children) {
                        queue.push(child)
                    }
                }
                this.calls[info.name]--
            }
        }
        if ([TYPES.ASSIGNMENT, TYPES.PROP_ASSIGNMENT].includes(info.type) && info.update) {
            info.value += info.update
        }
        this.steps.push(info)
        console.log(this.identifiers);
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
console.log(global[_name].scopeChain);
fs.writeFileSync('executed.json', JSON.stringify({
    steps: global[_name].steps,
    objects: global[_name].objects,
    refs: global[_name].refs,
    types: global[_name].types
}))


