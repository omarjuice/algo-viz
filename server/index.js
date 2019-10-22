require('dotenv').config()
const express = require('express')
const mongo = require('mongodb').MongoClient;
const session = require('express-session');
const MongoStore = require('connect-mongo')(session);
const cors = require('cors')
const path = require('path');
const app = express();
const execute = require('./js')
const env = process.env.NODE_ENV
const PORT = process.env.PORT || (env === 'test' ? 8080 : env === 'production' ? 3000 : 3001)




if (env === 'development') {
    app.use(cors({
        origin: 'http://localhost:3000',
        credentials: true
    }))
}

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(express.static(path.join(__dirname, "..", "client/build")));






async function initialize() {
    let hasError;
    const mongoUri = env === 'production' ? process.env.MONGO_URI : 'mongodb://localhost:27017';
    const dbName = env === 'test' ? 'algo_viz_test' : 'algo_viz'
    const client = await mongo.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true }).catch(e => hasError = true)
    const database = !hasError && client.db(dbName);
    const Issues = !hasError && database.collection('issues');
    const Submissions = !hasError && database.collection('submissions')




    app.use(session({
        store: !hasError ? new MongoStore({ url: env === 'production' ? mongoUri : mongoUri + '/' + dbName }) : null,
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
                if (e.isRunnerError || e.isTranspilerError) {
                    Issues.insertOne({
                        date: new Date(),
                        description: JSON.stringify(e),
                        code
                    })
                    if (e.isRunnerError) return next(new Error('The runner made a fatal mistake with your code. It will be investigated ASAP. In the meantime, please do not run the same code again.'))
                    if (e.isTranspilerError) return next(new Error('The transpiler made a fatal mistake with your code. It will be investigated ASAP. In the meantime, please do not run the same code again.'))
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
        try {
            Submissions.insertOne({
                date: new Date(),
                submitter: req.session.id,
                code
            })
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

    if (env === 'production') {
        app.get("/", (req, res, next) => {
            res.sendFile(path.join(__dirname, "..", "client/build/index.html"));
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