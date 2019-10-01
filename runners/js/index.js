"use strict"
const fs = require('fs')
const execute = require('./execute')
const transpile = require('./transpile')
const input = { _name: null, references: {} }
const env = process.env.NODE_ENV
const file = process.env.FILENAME
const vol = process.env.VOLUME
const prod = env === 'production'


function exec() {
    let code;

    if (env === 'test') {
        code = process.env.CODE
    } else {
        code = fs.readFileSync(`${vol}/${file}`, { encoding: 'utf8' })
    }
    if (!code) {
        throw new Error('No code provided.')
    }

    let transpiled = transpile(code, input)
    const { _name } = input


    !prod && fs.writeFile(`${vol}/${file}.transpiled.js`, transpiled, () => { })

    return execute(_name, transpiled, code)
}



if (env !== 'test') {
    try {
        const data = exec()
        fs.writeFileSync(`${vol}/${file}`, data)
    } catch (e) {
        fs.writeFileSync(`${vol}/${file}`, e)
    }
}

module.exports = exec







