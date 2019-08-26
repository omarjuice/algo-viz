const { Worker } = require('worker_threads')
const transpile = require('../transpile')
const fs = require('fs')
const prod = process.env.NODE_ENV === 'production'
module.exports = async function (code) {
    const input = { _name: null, references: {} }
    const transpiled = await transpile(code, input)
    !prod && fs.writeFile('transpiled.js', transpiled, () => { })
    const worker = new Worker(__dirname + '/thread.js', {
        workerData: {
            code: transpiled,
            _name: input._name,
            original: code,
            prod,
            timeout: Number(process.env.EXECUTION_TIMEOUT) || 500,
        }
    })
    return new Promise((resolve, reject) => {
        worker.on('message', data => {
            !prod && fs.writeFile('executed.json', data, () => { })
            resolve(data)
            worker.terminate()
        })
        worker.on('error', error => {
            worker.terminate();
            reject(error)
        })
    })
}