const execSync = require('./execute/execSync')
const fs = require('fs')
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


execSync(code).then(data => {
    fs.writeFileSync('../client/src/store/default.json', data)
})