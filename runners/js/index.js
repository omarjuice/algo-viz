const fs = require('fs')
const execute = require('./execute')
const transpile = require('./transpile')
const input = { _name: null, references: {} }
const env = process.env.NODE_ENV


const prod = env === 'production'

function exec() {
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
    const transpiled = transpile(code, input)

    const { _name } = input


    !prod && fs.writeFile('transpiled.js', transpiled, () => { })

    return execute(_name, transpiled, code)
}


if (env !== 'test') {
    exec()
    process.exit(1)

}
module.exports = exec





