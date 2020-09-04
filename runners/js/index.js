"use strict"
const fs = require('fs')
const execute = require('./execute')
const transpile = require('./transpile')
const input = { _name: null, references: {} }
const env = process.env.ENV
const file = process.env.FILENAME
const vol = process.env.VOLUME
const prod = env === 'production'

class TranspilerError extends Error {
    constructor(error) {
        super(error.message)
        this.name = 'TranspilerError'
    }

}


function exec() {
    let code;
    if (!env || env === 'test') {
        code = process.env.CODE
    } else {
        code = fs.readFileSync(`${vol}/${file}`, { encoding: 'utf8' })
    }
    if (!code) {
        throw new Error('No code provided.')
    }

    let transpiled;

    try {
        transpiled = transpile(code, input)
    } catch (e) {
        if (e instanceof SyntaxError) {
            throw e
        } else {
            throw new TranspilerError(e)
        }

    }
    const { _name } = input

    !prod && fs.writeFile(env === 'development' ? `${vol}/${file}.transpiled.js` : 'transpiled.js', transpiled, () => { })

    return execute(_name, transpiled, code)
}



if (env && env !== 'test') {
    try {
        const data = exec()
        fs.writeFileSync(`${vol}/${file}`, data)
    } catch (e) {
        fs.writeFileSync(`${vol}/${file}`, e)
    }
}

module.exports = exec







