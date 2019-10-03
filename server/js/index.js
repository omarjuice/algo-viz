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



const genName = (l = 3) => {
    let name;
    do {
        name = randomString(l)
    } while (names.has(name))
    return name

}




const names = new Set()


async function run(code) {
    const name = genName(6)
    const fileName = `-e FILENAME='${name}'`
    const env = `-e NODE_ENV=${NODE_ENV === 'development' ? NODE_ENV : 'production'}`
    const version = `-e DATA_VERSION=${DATA_VERSION}`
    const volume = `-e VOLUME='${folderName}'`
    const mem = `--memory=32m`
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
    const cmd = `docker run --rm ${fileName} ${volume} ${env} ${version} ${mem} ${cpus} ${timeout} -v ${path}:/usr/src/app/${folderName} exec-js`
    await new Promise((resolve, reject) => {
        exec(
            cmd,
            (err, stdout) => {
                if (err) {
                    switch (err.code) {
                        case 125:
                            reject(new Error('Container start failure.'));
                        case 126:
                            reject(new Error('Container start failure.'));
                        case 127:
                            reject(new Error('Container start failure.'));
                        case 137:
                            reject(new Error('Memory limit exceeded.'));
                        default:
                            reject(err)
                    }
                } else {
                    resolve(stdout)
                }
            })
    })

    return await new Promise((resolve, reject) => {
        const file = `${path}/${name}`
        fs.readFile(file, 'utf8', (err, data) => {
            if (err) {
                reject(err)
            } else {
                if (data[0] === '{') {
                    resolve(data)
                } else {
                    reject(new Error(data))
                }

            }
            if (NODE_ENV !== 'development') {
                fs.unlink(file, () => { })
                names.delete(name)
            }
        })
    })


}


module.exports = run


