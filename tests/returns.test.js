const stepify = require('../stepify')
const babel = require('@babel/core')
const funcs = require('./funcs')


const randomString = (l = 3) => {
    let id = (Math.random() * 26 + 10 | 0).toString(36)
    for (let i = 1; i < l; i++)
        id += (Math.random() * 26 | 0).toString(36)
    return id
}



async function testRunner(funcString) {

    const input = { _name: null, references: {} }
    const { code } = await babel.transformAsync(funcString, {
        plugins: [
            ['@babel/plugin-transform-destructuring', { loose: true }],
            '@babel/plugin-transform-parameters',
            'babel-plugin-transform-remove-console',
            [stepify(input), {
                disallow: {
                    async: true,
                    generator: true
                },
            }]
        ],
        parserOpts: {
            plugins: [
                "objectRestSpread",
            ]
        }
    })
    const { _name } = input
    global[_name] = {
        __: function (val) {
            return val
        },
    }
    const normalResult = eval(funcString)
    const transpiledResult = eval(code)

    // console.log(normalResult)
    // console.log(transpiledResult)
    expect(normalResult).toEqual(transpiledResult)
    global[_name] = undefined
}

for (let func in funcs) {
    test('RETURNS ' + func, async () => {
        await testRunner(funcs[func])
    })
}
