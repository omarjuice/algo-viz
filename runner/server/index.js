const express = require('express')
const cors = require('cors')
const runner = require('../execute');

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

app.post('/', async (req, res, next) => {
    const { code } = req.body;
    runner(code)
        .then(result => {
            res.send({ ...result, code })
        })
        .catch(e => next(e))
})
app.use((err, req, res, next) => {
    console.log(err);
    res.status(500).send(err)
})

app.listen(PORT, () => {
    console.log('LISTENING ON PORT ' + PORT);
})
module.exports = app