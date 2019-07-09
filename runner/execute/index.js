module.exports = async function (___code) {
    let ___name;
    eval(await (async function (func) {
        const stepify = require('./stepify')
        const babel = require('@babel/core')
        const fs = require('fs')
        const input = { _name: null, references: {} }
        const { code } = await babel.transformAsync(func, {
            plugins: [
                ['@babel/plugin-transform-destructuring', { loose: true }],
                ['@babel/plugin-transform-parameters', { loose: true }],
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
        fs.writeFile('transpiled.js', code, () => { })
        return code + `\n___name = '${_name}';`
    })(___code))
    const fs = require('fs')
    const { types, objects, steps } = global[___name]
    delete global[___name]
    fs.writeFile('executed.json', JSON.stringify({
        steps, objects, types
    }), () => { })
    return { types, objects, steps }

}