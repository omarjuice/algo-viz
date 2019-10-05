const stepify = require('./stepify')
const babel = require('@babel/core')
module.exports = function transpile(func, input) {
    const { code } = babel.transform(func, {
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