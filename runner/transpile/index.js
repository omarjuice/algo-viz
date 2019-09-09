const stepify = require('./stepify')
const babel = require('@babel/core')
const input = { _name: null, references: {} }

module.exports = async function transpile(func, input, ) {
    const { code } = await babel.transformAsync(func, {
        plugins: [
            [stepify(input), {
                disallow: {
                    async: true,
                },
            }]
        ],
        parserOpts: {
            strictMode: true
        },

    })
    return code
}