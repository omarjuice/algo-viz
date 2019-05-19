const stepify = require('./stepify')
const babel = require('@babel/core')
const func = `function twoNumberSum(array, targetSum) {
	const hash = {}
	for(let number of array){
		if(hash[number]){
			return number > hash[number] ? [hash[number], number] : [number, hash[number]]
		}
		hash[targetSum - number] = number;
	}
	return []
}
twoNumberSum([1,2], 3)
`

class Runner {
    constructor() {
        this.steps = []
    }
    __(val, info) {
        info.value = typeof val === 'boolean' ? String(val) : val

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
console.log(global[_name].steps);

