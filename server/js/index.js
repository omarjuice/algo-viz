require('dotenv').config()
const { DATA_VERSION, NODE_ENV, DATA_PATH } = process.env
const { exec } = require('child_process')
const fs = require('fs')

async function run(code, name) {
    const fileName = `-e FILENAME='data/${name}'`
    const env = `-e NODE_ENV=${NODE_ENV}`
    const version = `-e DATA_VERSION=${DATA_VERSION}`
    const mem = `--memory=32m`
    const path = DATA_PATH
    await new Promise((resolve, reject) => {
        fs.writeFile(`${path}/${name}`, code, (e) => {
            if (e) {
                reject(e)
            } else {
                resolve()
            }
        })
    })

    await new Promise((resolve, reject) => {
        exec(`docker run --rm ${fileName} ${env} ${version} ${mem} -v ${path}:/usr/src/app/data exec-js`, (err, stdout) => {
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


}

run(
    `
    const arr = new Array(1e3).fill(1)
` ,
    'twoNumberSum'
).then((result) => {
    console.log(result);
}).catch(e => {
    console.log(e.message);
})