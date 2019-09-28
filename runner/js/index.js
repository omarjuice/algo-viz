const execute = require('./execute')
const fs = require('fs')
execute()







console.log(
    fs.readdirSync('./'),
    fs.readdirSync('builtins'),
    fs.readdirSync('execute'),
    fs.readdirSync('transpile'),

);


