const funcs = require('./funcs')
const expect = require('expect')
const transpile = require('../../transpile')



async function testRunner(funcString) {

    const input = { _name: null, references: {} }
    const code = await transpile(funcString, input)
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

describe('RETURNS', () => {
    for (let func in funcs) {
        it(func, async () => {
            await testRunner(funcs[func])
        })
    }

})