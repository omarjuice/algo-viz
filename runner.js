const stepify = require('./stepify')
const babel = require('@babel/core')
const fs = require('fs')
const func = `function mergeSort(arr) {
    if (arr.length < 2) {
        return arr
    }
   const [firstHalf, secondHalf] = split(arr)
    return merge(mergeSort(firstHalf), mergeSort(secondHalf))
}
function split(arr) {
    const splitIdx = Math.floor(arr.length / 2)
    const firstHalf = arr.slice(0, splitIdx)
    const secondHalf = arr.slice(splitIdx, arr.length)
    return [firstHalf, secondHalf]
}
function merge(arr1, arr2) {
    let i = 0
    while (arr2.length>0) {
        const num = arr2.shift()
        while (num > arr1[i] && i < arr1.length) {
            i++
        }
        arr1.splice(i, 0, num)
    }
    return arr1
}
mergeSort([5,4,3,2,1])
`

class Runner {
    constructor() {
        this.steps = []
        this.temp = {}
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
        '@babel/plugin-transform-parameters',
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

