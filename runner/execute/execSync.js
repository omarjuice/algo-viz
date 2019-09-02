const { VM } = require('../../../vm2')
const { default: instantiateViz } = require('../../builtins/js/dist/index')
const Runner = require('./runner')
const util = require('util')
const transpile = require('../transpile')


module.exports = async function (code) {
    const input = { _name: null, references: {} }
    const transpiled = await transpile(code, input)
    const fs = require('fs')
    fs.writeFile('transpiled.js', transpiled, () => { })
    const { _name } = input
    const runner = new Runner(_name, code)
    const vm = new VM({
        console: 'inherit',
        sandbox: {
            [_name]: runner,
            Viz: instantiateViz(runner)
        },
        timeout: 500,
    })
    try {
        vm.run(transpiled)
    } catch (error) {
        runner.ignore(true)
        runner.steps.push({
            type: 'ERROR',
            error: error.message || 'ERROR'
        })
    }
    const { steps, objects, types, objectIndex } = runner
    try {
        const data = JSON.stringify({
            steps, objects, types, objectIndex, code,
        })
        fs.writeFileSync('executed.json', data)
        return data
    } catch (e) {
        try {
            const getCircularReplacer = () => {
                const seen = new Set();
                return (key, value) => {
                    if (typeof value === "object" && value !== null) {
                        if (seen.has(value)) {
                            return;
                        }
                        seen.add(value);
                    }
                    return value;
                };
            };

            const data = JSON.stringify({ steps, objects, types, objectIndex, code }, getCircularReplacer());
            return data
        } catch (e) {
            require('fs').writeFileSync('debug.txt', util.inspect({ steps, objects, types, objectIndex }))
            throw e
        }


    }


}





