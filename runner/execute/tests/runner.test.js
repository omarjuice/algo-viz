
const stepIterator = require('../stepIterator')
const babel = require('@babel/core')
const funcs = JSON.parse(require('fs').readFileSync(__dirname + '/funcs.json', { encoding: 'utf8' }))
const stepify = require('../stepify')
const expect = require('expect')
const print = (val) => {
    // console.log(val)
    return val
}
async function main(program) {



    const input = { _name: null, references: {} }
    const { code } = await babel.transformAsync(program, {
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
    const scopeStack = [null]
    const callStack = []
    const scopeChain = {}
    const identifiers = {}
    const funcScopes = {}
    const calls = {}
    stepIterator(steps, { scopeChain, scopeStack, callStack, identifiers, funcScopes, calls, code: func })
    expect(transpiledResult).toEqual(normalResult)


}
describe('RUNNER', () => {
    for (let func in funcs) {
        it(func, async () => {
            await testRunner(funcs[func])
        })
    }
})