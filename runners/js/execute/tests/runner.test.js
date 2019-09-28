const funcs = require('./funcs')
const expect = require('expect')
const transpile = require('../../transpile')
const print = (val) => {
    // console.log(val)
    return val
}
async function main(program) {

    const input = { _name: null, references: {} }
    const code = await transpile(program, input)
    const { _name } = input

    global[_name] = new (require('../runner'))(_name, program)

    const transpiledResult = eval(code)
    const normalResult = eval(program)
    const { steps, objects, types } = global[_name]

    delete global[_name]
    return {
        steps, objects, types, normalResult,
        transpiledResult
    }
}

async function testRunner(func) {

    const { steps, objects, types, normalResult, transpiledResult } = await main(func)
    expect(Array.isArray(steps) && steps.length > 0).toBe(true)
    expect(typeof objects).toBe('object')
    expect(typeof types).toBe('object')

    expect(transpiledResult).toEqual(normalResult)


}
describe('RUNNER', () => {
    for (const func in funcs) {
        it(func, async () => {
            await testRunner(funcs[func])
        })
    }
})