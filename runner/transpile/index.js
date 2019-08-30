const stepify = require('./stepify')
const babel = require('@babel/core')
const input = { _name: null, references: {} }

module.exports = async function transpile(func, input, ) {
    const { code } = await babel.transformAsync(func, {
        plugins: [
            ['@babel/plugin-transform-destructuring', { loose: true }],
            ['@babel/plugin-transform-parameters', { loose: true }],
            'babel-plugin-transform-remove-console',
            [stepify(input), {
                disallow: {
                    async: true,
                },
            }]
        ],
        parserOpts: {
            strictMode: true
        }
    })
    return code
}