const vm = require('vm')
const { default: instantiateViz } = require('../builtins/dist');
const Runner = require('./runner')
const util = require('util')
const version = process.env.DATA_VERSION;
const prod = process.env.NODE_ENV === 'production'
const fs = require('fs')


class RunnerError extends Error {
    constructor(error) {
        super(error.message)
        this.name = 'RunnerError'
    }
}

module.exports = function (_name, transpiled, code) {
    const runner = new Runner(_name)
    try {
        const sandBox = {
            [_name]: runner,
            Viz: instantiateViz(runner),
        }
        Object.defineProperty(sandBox, _name, {
            value: runner,
            enumerable: false
        })
        vm.runInNewContext(transpiled, sandBox, {
            timeout: 5000
        })
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
            steps, objects, types, objectIndex, code, version
        })
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

            const data = JSON.stringify({ steps, objects, types, objectIndex, code, version }, getCircularReplacer());
            return data
        } catch (e) {

            !prod && fs.writeFileSync('debug.txt', util.inspect({ steps, objects, types, objectIndex }))
            throw new RunnerError(e)
        }
    }
}
