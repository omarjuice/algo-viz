
const stepIterator = require('../stepIterator')
const babel = require('@babel/core')
const fs = require('fs')
const stepify = require('../stepify')
const expect = require('expect')

const print = (val) => {
    // console.log(val)
    return val
}
class Circular {
    constructor() {
        this.value = this
        this.array = [this]
        this.object = { value: this }
        this.object.obj = this.object
        this.val = 0
        this.notCircular = { hello: true }
        this.arr = [1, 2, 3, this.notCircular]
        this.arrContainer = [this.arr]
    }
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
    fs.writeFileSync('transpiled.js', code)
    const { _name } = input

    global[_name] = new (require('../runner'))(_name, program)

    const transpiledResult = eval(code)
    const normalResult = eval(program)
    const { steps, objects, types } = global[_name]
    fs.writeFileSync('executed.json', JSON.stringify({
        steps,
        objects,
        types,

    }))
    delete global[_name]
    return {
        steps, objects, types, normalResult,
        transpiledResult
    }
}

async function testRunner(func) {

    const { steps, objects, types, normalResult } = await main(func)
    // console.log(normalResult)
    // expect(transpiledResult).toEqual(normalResult)


}

describe('RECONSTRUCT', () => {
    it('case #1', async () => {
        const func = `
            function init(obj){
                obj.hello = 1;
                return obj
            }
            init({})
        `
        await testRunner(func)
    })
})