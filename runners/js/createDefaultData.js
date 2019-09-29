const fs = require('fs')
const execute = require('./execute')
const transpile = require('./transpile')
const input = { _name: null, references: {} }
const code = `

const hello = Viz.SLL.create('HELLO'.split(''));
const world = Viz.DLL.create('WORLD'.split(''))
    
const welcome = [
    'WELCOME '.split(''),
    '   TO   '.split(''),
    'ALGO-VIZ'.split('')
]
    
const emote = new Set(['🤓'])
    
const message = 'See the ℹ️ for a guide ----->'

`




const transpiled = transpile(code, input)

const { _name } = input



const data = execute(_name, transpiled, code)


fs.writeFileSync('../../client/src/store/default.json', data)

