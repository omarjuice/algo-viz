const { Worker } = require('worker_threads')
const transpile = require('../transpile')
const fs = require('fs')

module.exports = async function (code) {
    const input = { _name: null, references: {} }
    const transpiled = await transpile(code, input)
    fs.writeFile('transpiled.js', transpiled, () => { })
    const worker = new Worker(__dirname + '/thread.js', {
        workerData: {
            code: transpiled,
            _name: input._name,
            original: code
        }
    })
    return new Promise((resolve, reject) => {
        worker.on('message', data => {
            fs.writeFile('executed.json', data, () => { })
            resolve(data)
        })
        worker.on('error', reject)
    })
}