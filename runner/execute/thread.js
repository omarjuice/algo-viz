const { parentPort, workerData, } = require('worker_threads')
const { VM } = require('../../../vm2')
const { default: instantiateViz } = require('../../builtins/js/dist/index')
const Runner = require('./runner')
const util = require('util')

const { code, _name, original } = workerData
const runner = new Runner(_name, original)
const vm = new VM({
    console: 'inherit',
    sandbox: {
        [_name]: runner,
        Viz: instantiateViz(runner)
    },
    timeout: 500,
})

try {
    vm.run(code)
} catch (error) {
    console.log(error);
    runner.ignore(true)
    runner.steps.push({
        type: 'ERROR',
        error: error.message || 'ERROR'
    })
}
const { steps, objects, types } = runner
try {
    const data = JSON.stringify({
        steps, objects, types, code: original
    })
    parentPort.postMessage(data)
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

        const data = JSON.stringify({ steps, objects, types, code: original }, getCircularReplacer());
        parentPort.postMessage(data)
    } catch (e) {
        require('fs').writeFileSync('debug.txt', util.inspect({ steps, objects, types }))
        throw new Error('Your code has an error that could not be shown to you')
    }


}




process.exit(1)
