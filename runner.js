const stepify = require('./stepify')
const babel = require('@babel/core')
const fs = require('fs')
const func = `function append1(...arr){
    arr.push(1)
    return arr
}
append1(3,2)
`
function JSONreplacer(_, value) {
    if (value === undefined) {
        return 'undefined'
    }
    return value
}
class Runner {
    constructor() {
        this.steps = []
    }
    __(val, info) {
        info.value = typeof val === 'boolean' ? String(val) : typeof val === 'object' ? JSON.stringify(val) : val
        if (info.arguments) {
            info.arguments = JSON.stringify(info.arguments)
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
    ]
})

global[_name] = new Runner()

eval(code)
console.log(code)
console.log('NUMBER OF STEPS ', global[_name].steps.length);
fs.writeFileSync('executed.json', JSON.stringify(global[_name].steps))

