const stepify = require('./stepify')
const babel = require('@babel/core')
const fs = require('fs')
const stringify = require('./utils/stringify')
const TYPES = require('./utils/types')
const func = `function append1(...arr){
    const z = arr.slice()
    arr.push(0+1)
    return arr
}
const arr = [3,2]
append1(...arr)
`

class Runner {
    constructor() {
        this.steps = []
        this.map = new Map()
        this.objects = {}
        this.aliases = {}
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
console.log(code)
console.log('NUMBER OF STEPS ', global[_name].steps.length);
fs.writeFileSync('executed.json', JSON.stringify({
    steps: global[_name].steps,
    objects: global[_name].objects
}))



