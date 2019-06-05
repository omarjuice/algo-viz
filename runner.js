const stepify = require('./stepify')
const babel = require('@babel/core')
const fs = require('fs')
const stringify = require('./utils/stringify')
const configEnv = require('./utils/setup')
const TYPES = require('./utils/types')
const stepIterator = require('./stepIterator')

const print = v => { return console.log(v), v };


const func = `
class BST {
    constructor(value) {
      this.value = value;
      this.left = null;
      this.right = null;
    }
  
    insert(value) {
      if (value < this.value) {
        if (!this.left) {
          this.left = new BST(value);
        } else {
          this.left.insert(value);
        }
      } else {
        if (!this.right) {
          this.right = new BST(value);
        } else {
          this.right.insert(value);
        }
      }
      return this;
    }
  }
  
  const test1 = new BST(10).insert(5).insert(15);
    
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
    }
    __(val, info) {
        this.allow && this.allow(false)
        const objectTypes = [TYPES.PROP_ASSIGNMENT, TYPES.METHODCALL, TYPES.ACTION, TYPES.SPREAD, TYPES.DELETE, TYPES.ACCESSOR]
        if ([TYPES.CALL, TYPES.METHODCALL, TYPES.ACTION].includes(info.type)) {
            const id = this.stringify(info.arguments)
            info.arguments = this.objects[id]
            delete this.objects[id]
            delete this.types[id]
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
        const currentFunc = this.callStack[this.callStack.length - 1]
        const isConstructor = currentFunc && currentFunc.type === TYPES.METHOD && currentFunc.kind === 'constructor'
        if (!(isConstructor && objectTypes.includes(info.type) && info.object === currentFunc.object)) {
            if (objectTypes.includes(info.type)) {
                info.object = this.stringify(info.object)
            }
            info.value = this.stringify(val)
            this.steps.push(info)
        }
        console.log(this.callStack)
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


