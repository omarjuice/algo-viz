module.exports = function (___code) {
    let ___name;
    eval((function (func) {
        const stepify = require('./stepify')
        const babel = require('@babel/core')
        const fs = require('fs')
        const input = { _name: null, references: {} }
        const { code } = babel.transformSync(func, {
            plugins: [
                ['@babel/plugin-transform-destructuring', { loose: true }],
                ['@babel/plugin-transform-parameters', { loose: true }],
                ['@babel/plugin-transform-spread', { loose: true }],
                'babel-plugin-transform-remove-console',
                [stepify(input), {
                    disallow: {
                        async: true,
                        generator: true
                    },
                }]
            ],
            parserOpts: {
                strictMode: true
            }
        })
        const { _name } = input
        global[_name] = new (require('./runner'))(_name, func)
        fs.writeFileSync('transpiled.js', code)
        return code + `\n___name = '${_name}';`
    })(___code))
    global[___name].reset()
    console.log('NUMBER OF STEPS ', global[___name].steps.length);
    const fs = require('fs')
    const stepIterator = require('./stepIterator')
    const reconstructor = require('./reconstructor')
    const { identifiers } = stepIterator(global[___name].steps, { code: ___code })
    const { types, objects, steps, primitives } = global[___name]
    reconstructor({ types, steps, objects, primitives })
    fs.writeFileSync('executed.json', JSON.stringify({
        steps, objects, types, primitives
    }))
}