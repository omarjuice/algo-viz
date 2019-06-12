const express = require('express')
const runner = require('../runner');

const app = express();

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.get('/', (req, res) => {
    res.send('OK')
})

app.listen(3000, () => {
    console.log('LISTENING ON PORT 3000');
})