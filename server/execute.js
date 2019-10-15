require('dotenv').config()
const { DATA_VERSION = 1, NODE_ENV, DATA_PATH } = process.env
const { exec } = require('child_process')
const folderName = `data`
require('mkdirp').sync(folderName)
const fs = require('fs')




const randomString = (l = 3) => {
    let id = (Math.random() * 26 + 10 | 0).toString(36)
    for (let i = 1; i < l; i++)
        id += (Math.random() * 26 | 0).toString(36)
    return id
}







const names = new Set()


const genName = (l = 3) => {
    let name;
    do {
        name = randomString(l)
    } while (names.has(name))
    names.add(name)
    return name

}


async function execute(code, language) {
    if (!['javascript', 'python'].includes(language)) {
        throw new Error(`Langauge ${language} not available.`)
    }
    const name = genName(6)
    const fileName = `-e FILENAME='${name}'`
    const env = `-e ENV='${NODE_ENV === 'development' ? NODE_ENV : 'production'}'`
    const version = `-e DATA_VERSION=${DATA_VERSION}`
    const volume = `-e VOLUME='${folderName}'`
    const mem = `--memory=64m`
    const cpus = `--cpus=1`
    const timeout = `--stop-timeout=${process.env.EXECUTION_TIMEOUT / 1000 || 5}`
    const path = DATA_PATH + folderName
    await new Promise((resolve, reject) => {
        fs.writeFile(`${path}/${name}`, code, (e) => {
            if (e) {
                reject(e)
            } else {
                resolve()
            }
        })
    })
    const cmd = `docker run --rm ${fileName} ${volume} ${env} ${version} ${mem} ${cpus} ${timeout} -v ${path}:/usr/src/app/${folderName} ${language}`

    const file = `${path}/${name}`
    await new Promise((resolve, reject) => {
        exec(
            cmd,
            (err, stdout) => {
                if (err) {
                    let errData = 'ContainerError: '
                    switch (err.code) {
                        case 125:
                            errData += 'Container start failure.'
                        case 126:
                            errData += 'Container start failure.'
                        case 127:
                            errData += 'Container start failure.'
                        case 137:
                            errData += 'Memory limit exceeded.'
                        default:
                            errData += ' Execution failed.'
                    }
                    fs.writeFile(file, errData, () => {
                        resolve()
                    })
                } else {
                    if (NODE_ENV === 'development') {
                        console.log(stdout);
                    }
                    resolve(stdout)
                }
            })
    })

    return await new Promise((resolve, reject) => {

        fs.readFile(file, 'utf8', (err, data) => {
            if (NODE_ENV !== 'development') {
                fs.unlink(file, () => { })
                names.delete(name)
            }
            if (err) {
                reject(err)
            } else {
                if (data[0] === '{') {
                    resolve(data)
                } else {
                    const error = new Error(data)

                    if (data.startsWith('TranspilerError')) {
                        error.isTranspilerError = true
                    } else if (data.startsWith('ContainerError')) {
                        error.isContainerError = true
                    } else if (data.startsWith('RunnerError')) {
                        error.isRunnerError = true
                    }
                    reject(error)

                }
            }
        })
    })


}


module.exports = execute


