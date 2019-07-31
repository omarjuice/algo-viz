const version = parseInt(process.versions.node.split('.')[0])

process.env.VERSION = version
const express = require('express')
const cors = require('cors')

const app = express();
const PORT = process.env.PORT || process.env.NODE_ENV === 'test' ? 8080 : 3001

if (process.env.NODE_ENV === 'development') {
    app.use(cors({
        origin: 'http://localhost:3000'
    }))
}

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.get('/', (req, res) => {
    res.send('OK')
})

let execute;
if (version >= 11) {
    execute = require('../execute')
    console.log(`
    ****************************************
    NODE version >= 11 or greater detected. Defaulting to concurrent sandbox execution.
    ****************************************
    `)
} else {
    execute = require('../execute/execSync')
    console.log(`
    ****************************************
    NODE version < 11 detected. Defaulting to single threaded execution without sandboxing.
    ****************************************
    `)
}


app.post('/', async (req, res, next) => {
    const { code } = req.body;
    execute(code)
        .then(result => {
            res.send(JSON.parse(result))
        })
        .catch(e => {
            next(e)
        })
})
app.use((err, req, res, next) => {
    console.log(err);
    res.status(500).send(err.message)
})

app.listen(PORT, () => {
    console.log('LISTENING ON PORT ' + PORT);
})
module.exports = app

process.on('uncaughtException', (e) => console.log(e))