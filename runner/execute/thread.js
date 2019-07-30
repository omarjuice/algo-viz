const { parentPort, workerData, } = require('worker_threads')
const { VM } = require('../../../vm2')
const { default: instantiateViz } = require('../../builtins/js/dist/index')
const Runner = require('./runner')


const { code, _name, original } = workerData
const runner = new Runner(_name, original)
const vm = new VM({
    sandbox: {
        [_name]: runner,
        Viz: instantiateViz(runner)
    },
    timeout: 500,
})
try {
    vm.run(code)
} catch (error) {
    runner.steps.push({
        type: 'ERROR',
        error: error.message
    })
}
const { steps, objects, types } = runner
const data = JSON.stringify({
    steps, objects, types, code: original
})
parentPort.postMessage(data)


process.exit(1)
