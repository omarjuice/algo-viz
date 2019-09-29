const start = Date.now()

console.log(
    'SPIN TIME',
    start - Number(process.env.START_TIME)
);

const fs = require('fs')
const execute = require('./execute')
const transpile = require('./transpile')
const input = { _name: null, references: {} }
const env = process.env.NODE_ENV


const prod = env === 'production'

function exec() {
    const code = fs.readFileSync(`volume/${process.env.FILENAME}`, { encoding: 'utf8' })
    if (!code) {
        throw new Error('No code provided.')
    }

    const transpiled = transpile(code, input)



    const { _name } = input


    !prod && fs.writeFile('transpiled.js', transpiled, () => { })

    return execute(_name, transpiled, code)
}



if (env !== 'test') {
    const data = exec()
    fs.writeFileSync(`volume/${process.env.FILENAME}`, data)


}

console.log('EXECUTION TIME', Date.now() - start);
module.exports = exec





