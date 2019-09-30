const fs = require('fs')
const execute = require('./execute')
const transpile = require('./transpile')
const input = { _name: null, references: {} }
const env = process.env.NODE_ENV
const file = process.env.FILENAME

const prod = env === 'production'

function exec() {
    const code = fs.readFileSync(file, { encoding: 'utf8' })
    if (!code) {
        throw new Error('No code provided.')
    }

    let transpiled = transpile(code, input)



    const { _name } = input


    !prod && fs.writeFile('transpiled.js', transpiled, () => { })

    return execute(_name, transpiled, code)
}



if (env !== 'test') {
    try {
        const data = exec()
        fs.writeFileSync(file, data)
    } catch (e) {
        fs.writeFileSync(file, e)
    }
}

module.exports = exec





