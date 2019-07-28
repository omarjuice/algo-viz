const { VM } = require('vm2')
const { default: instantiateViz } = require('../../builtins/js/dist/index')
const Runner = require('./runner')

const stepify = require('./stepify')
const babel = require('@babel/core')
const fs = require('fs')


module.exports = async function (code) {
    const input = { _name: null, references: {} }
    const { code: transpiled } = await babel.transformAsync(code, {
        plugins: [
            ['@babel/plugin-transform-destructuring', { loose: true }],
            ['@babel/plugin-transform-parameters', { loose: true }],
            'babel-plugin-transform-remove-console',
            [stepify(input), {
                disallow: {
                    async: true,
                    generator: true
                },
            }]
        ],
        parserOpts: {
            strictMode: true
        }
    })
    fs.writeFile('transpiled.js', transpiled, () => { })
    const { _name } = input
    const runner = new Runner(_name, code)
    const vm = new VM({
        sandbox: {
            [_name]: runner,
            Viz: instantiateViz(runner)
        },
        timeout: 1000
    })
    try {
        vm.run(transpiled)
    } catch (error) {
        runner.steps.push({
            type: 'ERROR',
            error: error.message
        })
    }
    const { steps, objects, types } = runner
    fs.writeFile('executed.json', JSON.stringify({
        steps, objects, types
    }), () => { })
    return { steps, objects, types }

}