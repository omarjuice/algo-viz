const version = parseInt(process.versions.node.split('.')[0])
process.env.VERSION = version
const express = require('express')
const mongo = require('mongodb').MongoClient;
const cors = require('cors')
const path = require('path');
const app = express();
const PORT = process.env.PORT || (process.env.NODE_ENV === 'test' ? 8080 : 3001)






if (process.env.NODE_ENV === 'development') {
    app.use(cors({
        origin: 'http://localhost:3000'
    }))
}

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(express.static(path.join(__dirname, "..", "..", "client/build")));



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



async function initialize() {
    const client = await mongo.connect(process.env.MONGO_URI || 'mongodb://localhost:27017', { useNewUrlParser: true })
    const database = client.db(process.env.NODE_ENV === 'test' ? 'algo_viz_test' : 'algo_viz')
    const Issues = database.collection('issues');

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

    app.post('/issues', async (req, res, next) => {
        try {
            const { description, code } = req.body;
            console.log(description)
            if (!description || !code) throw new Error('Missing Fields.')
            const { ops: [newIssue] } = await Issues.insertOne({
                date: new Date(),
                description,
                code
            })
            res.status(201).json(newIssue)
        } catch (e) {
            next(e)
        }
    })
    if (process.env.NODE_ENV === 'production') {
        app.get("/", (req, res, next) => {
            res.sendFile(path.join(__dirname, "..", "..", "client/build/index.html"));
        });
    }
    app.use((err, req, res, next) => {
        console.log(err);
        res.status(500).send(err.message)
    })





    await new Promise(resolve => {
        app.listen(PORT, () => {
            console.log('LISTENING ON PORT ' + PORT);
            resolve()
        })
    })

    return { server: app, database }
}

const init = initialize()

module.exports = { init }

process.on('uncaughtException', (e) => console.log(e))