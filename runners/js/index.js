const fs = require('fs')
const execute = require('./execute')
const transpile = require('./transpile')
const input = { _name: null, references: {} }
const env = process.env.NODE_ENV
const code = process.env.CODE || `
function boo(array, targetSum) {
    const hash = {}
for(let number of array){
        if(hash[number]){
            return number > hash[number] ? [hash[number], number] : [number, hash[number]]
    }
    hash[targetSum - number] = number;
}
return []
}
boo([5,4,3,2,1], 5)
`

const prod = env === 'production'


const transpiled = transpile(code, input)

const { _name } = input


!prod && fs.writeFile('transpiled.js', transpiled, () => { })

execute(_name, transpiled, code)



process.exit(1)





