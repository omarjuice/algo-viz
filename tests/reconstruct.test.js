
const stepIterator = require('../stepIterator')
const babel = require('@babel/core')
const fs = require('fs')
const stepify = require('../stepify')
const expect = require('expect')
const reconstructor = require('../reconstructor')

const print = (val) => {
    console.log(val)
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
    const { steps, objects, types, map } = global[_name]
    fs.writeFileSync('executed.json', JSON.stringify({
        steps,
        objects,
        types,

    }))
    delete global[_name]
    return {
        steps, objects, types, normalResult,
        transpiledResult, map
    }
}

async function testRunner(func) {
    const { steps, objects, types, normalResult, map, transpiledResult } = await main(func)
    expect(normalResult).toBeTruthy()
    expect(typeof normalResult).toBe('object')
    expect(transpiledResult).toBeTruthy()
    expect(typeof transpiledResult).toBe('object')
    expect(normalResult).toEqual(transpiledResult)


    const key = map.get(transpiledResult)

    expect(key).toBeTruthy()

    const { [key]: reconstructed } = reconstructor({ types, steps, objects })
    expect(typeof reconstructed).toBe('object')
    expect(reconstructed).toBeTruthy()
    expect(reconstructed).toEqual(normalResult)
    expect(reconstructed).not.toBe(normalResult)
    expect(reconstructed).not.toBe(transpiledResult)
    // console.log(reconstructed)
    // console.log(normalResult)


}

describe('RECONSTRUCT', () => {

    describe('ARRAYS', () => {
        it('case #1: array val assignment', async () => {
            const func = `
            function init(obj){
                obj[1] = 1;
                return obj
                
            }
            init(new Array(10))
            `
            await testRunner(func)
        })
        it('case #2: array sorting', async () => {
            const func = `
            function init(obj){
                obj.sort()
                return obj
                
            }
            init([5,4,3,2,1])
            `
            await testRunner(func)
        })
        it('case #3: array splicing', async () => {
            const func = `
            function init(obj){
                obj.splice(1,2)
                return obj
                
            }
            init([5,4,3,2,1])
            `
            await testRunner(func)
        })
        it('case #4: array copyWithin', async () => {
            const func = `
            function init(obj){
                obj.copyWithin(-2)
                return obj
                
            }
            init([5,4,3,2,1])
            `
            await testRunner(func)
        })
        it('case #5: other array mutations', async () => {
            const func = `
            function init(obj){
                obj.push(0, -1, -2, -3)
                obj.shift()
                obj.unshift(6,7)
                obj.pop()
                obj.pop()
                obj.sort()
                obj.pop()
                return obj            
            }
            init([5,4,3,2,1])
            `
            await testRunner(func)
        })
        it('case #6: array deletes', async () => {
            const func = `
            function init(obj){
                delete obj[4]
                return obj          
            }
            init([5,4,3,2,1])
            `
            await testRunner(func)
        })
        it('case #7: array iterations', async () => {
            const func = `
            function init(obj){
                const newArr = [];
               obj.forEach(el => newArr.push(el)) 
               return newArr    
            }
            init([5,4,,2,1])
            `
            await testRunner(func)
        })
        it.only('case #7: array length changing', async () => {
            const func = `
            function init(obj){
                obj[10] = 100
                return obj.sort((a,b)=>a-b)
            }
            init([5,4,3,2,1])
            `
            await testRunner(func)
        })
    })
    describe('OBJECTS', () => {
        it('case #1: normal prop assignment', async () => {
            const func = `
                function init(obj){
                    obj.hello = 1;
                    return obj
                }
                init({})
            `
            await testRunner(func)
        })
        it('case #1: deletion', async () => {
            const func = `
                function init(obj){
                    obj.hello = null;
                    delete obj.prop
                    return obj
                }
                init({prop: null})
            `
            await testRunner(func)
        })
    })
})