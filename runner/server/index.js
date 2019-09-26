require('dotenv').config()
const version = parseInt(process.versions.node.split('.')[0])
process.env.VERSION = version
const express = require('express')
const mongo = require('mongodb').MongoClient;
const session = require('express-session');
const MongoStore = require('connect-mongo')(session);
const cors = require('cors')
const path = require('path');
const fs = require('fs')
const app = express();
const PORT = process.env.PORT || (process.env.NODE_ENV === 'test' ? 8080 : 3001)
const env = process.env.NODE_ENV


fs.writeFileSync('endpoint.js',
    env === 'production'
        ? `module.exports = "http://algo-viz.herokuapp.com/execute"`
        : `module.exports = "http://localhost:${PORT}/execute"`
)



if (process.env.NODE_ENV === 'development') {
    app.use(cors({
        origin: 'http://localhost:3000',
        credentials: true
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

    const mongoUri = env === 'production' ? process.env.MONGO_URI : 'mongodb://localhost:27017';
    const dbName = env === 'test' ? 'algo_viz_test' : 'algo_viz'
    const client = await mongo.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true })
    const database = client.db(dbName);
    const Issues = database.collection('issues');


    app.use(session({
        store: new MongoStore({ url: env === 'production' ? mongoUri : mongoUri + '/' + dbName }),
        secret: process.env.SESSION_SECRET || 'secret',
        resave: false,
        saveUninitialized: true,
        cookie: {
            expires: new Date(253402300000000)
        }
    }));

    app.post('/execute', (req, res, next) => {
        const { code } = req.body;
        execute(code)
            .then(result => {
                res.send(JSON.parse(result))
            })
            .catch(e => {
                if (e.isRunnerError) {
                    Issues.insertOne({
                        date: new Date(),
                        description: JSON.stringify(e),
                        code
                    })
                    next(new Error('The runner made a fatal mistake with your code. It will be investigated ASAP. In the meantime, please do not run the same code again.'))
                } else {
                    next(e)
                }

            })
        try {
            if (req.session.submissions) {
                req.session.submissions++;
            } else {
                req.session.submissions = 1;
            }
            req.session.save()
        } catch (e) {
            console.log(e);
        }
    })

    app.post('/issues', async (req, res, next) => {
        try {
            const { description, code } = req.body;
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