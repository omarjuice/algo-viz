const _ = require('lodash')
const expect = require('expect')
const reconstructor = require('../reconstructor')
const funcs = require('./funcs')
const transpile = require('../../transpile')

const print = v => (console.log(v), v)
describe('RECONSTRUCT', () => {
    async function main(program) {

        const input = { _name: null, references: {} }
        const code = await transpile(program, input)
        const { _name } = input

        global[_name] = new (require('../runner'))(_name, program)

        const transpiledResult = eval(code)
        const normalResult = eval(program)
        const { steps, objects, types, map } = global[_name]
        delete global[_name]
        return {
            steps, objects, types, normalResult,
            transpiledResult, map, code: program
        }
    }

    async function testRunner(func) {
        const { steps, objects, types, normalResult, map, transpiledResult, code } = await main(func)
        expect(normalResult).toBeTruthy()
        expect(typeof normalResult).toBe('object')
        expect(transpiledResult).toBeTruthy()
        expect(typeof transpiledResult).toBe('object')

        expect(transpiledResult).toEqual(normalResult)


        const key = map.get(transpiledResult)

        expect(key).toBeTruthy()

        const { objects: { [key]: reconstructed } } = reconstructor({ types, steps, objects, code })
        expect(typeof reconstructed).toBe('object')
        expect(reconstructed).toBeTruthy()

        expect(reconstructed).toEqual(normalResult)
        expect(reconstructed).not.toBe(normalResult)
        expect(reconstructed).not.toBe(transpiledResult)
        // console.log(JSON.stringify(reconstructed, null, 2))
        // console.log(JSON.stringify(normalResult, null, 2))

    }
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
        it('case #8: array length changing', async () => {
            const func = `
            function init(obj){
                obj[10] = 100
                return obj.sort((a,b)=>a-b)
                // return obj
            }
            init([5,4,3,2,1])
            `
            await testRunner(func)
        })
        it('case #9: function mergeSort', async () => {
            const func = funcs.mergeSort
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
        it('case #2: deletion', async () => {
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
        it('case #3: Object.assign', async () => {
            const func = `
            const other1 = { prop1: 1 }
            const other2 = { prop2: 2 }
            const other3 = { prop0: 3 } 
            function init(obj){
                Object.assign(obj, other1, other2, other3)
                return obj
            }
            init({prop0: 0})
        `
            await testRunner(func)
        })
        it('case #4: function BST', async () => {
            const func = funcs.BST
            await testRunner(func)
        })
        it('case #5: class Extension', async () => {

            const func = `
                class SLL{
                    constructor(v){
                        this.value = v
                        this.next = null
                    }
                }
                class L extends SLL {
                    constructor(v) {
                        const b = (func) => {
                            func()
                        }

                        b(() => super(v))
                        this.r = 10001
                    }
                }


                new L(5)

            `
            await testRunner(func)
        })

    })
})
describe('DECONSTRUCT(reverse)', () => {
    async function main(program, copies) {


        const input = { _name: null, references: {} }
        const code = await transpile(program, input)
        const { _name } = input


        global[_name] = new (require('../runner'))(_name, program)
        let object = copies.transpiled
        const transpiledResult = eval(code)
        object = copies.normal
        const normalResult = eval(program)
        const { steps, objects, types, map } = global[_name]

        delete global[_name]
        return {
            steps, objects, types, normalResult,
            transpiledResult, map, code: program
        }
    }

    async function testRunner(func, copies, original) {
        const { steps, objects, types, map, transpiledResult, code } = await main(func, copies)
        expect(copies.normal).toEqual(copies.transpiled)

        expect(original).not.toEqual(copies.normal)
        const key = map.get(transpiledResult)


        const { objects: { [key]: reconstructed }, reverse } = reconstructor({ types, steps, objects, code })
        reverse()
        expect(reconstructed).toEqual(original)

    }
    const getCopies = obj => ({
        normal: _.cloneDeep(obj),
        transpiled: _.cloneDeep(obj)
    })
    describe('ARRAYS', () => {

        it('case #1: array val assignment', async () => {
            const original = new Array(3)
            const copies = getCopies(original)
            const func = `
            function init(array){
                array[1] = 1;
                return array
                
            }
            init(object)
            `
            await testRunner(func, copies, original)
        })
        it('case #2: array sorting', async () => {
            const original = [5, 4, 3, 2, 1]
            const copies = getCopies(original)
            const func = `
            function init(obj){
                obj.sort()
                return obj
                
            }
            init(object)
            `
            await testRunner(func, copies, original)
        })
        it('case #3: array splicing', async () => {
            const original = [5, 4, 3, 2, 1]
            const copies = getCopies(original)
            const func = `
            function init(obj){
                obj.splice(1,2)
                return obj
                
            }
            init(object)
            `
            await testRunner(func, copies, original)
        })
        it('case #4: array copyWithin', async () => {
            const original = [5, 4, 3, 2, 1]
            const copies = getCopies(original)
            const func = `
            function init(obj){
                obj.copyWithin(-2)
                return obj
                
            }
            init(object)
            `
            await testRunner(func, copies, original)
        })
        it('case #5: other array mutations', async () => {
            const original = [5, 4, 3, 2, 1]
            const copies = getCopies(original)
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
            init(object)
            `
            await testRunner(func, copies, original)
        })
        it('case #6: array deletes', async () => {
            const original = [5, 4, 3, 2, 1]
            const copies = getCopies(original)
            const func = `
            function init(obj){
                delete obj[4]
                return obj          
            }
            init(object)
            `
            await testRunner(func, copies, original)
        })
        it('case #7: array length changing', async () => {
            const original = [5, 4, 3, 2, 1]
            const copies = getCopies(original)
            const func = `
            function init(obj){

                obj[10] = 100
                return obj.sort((a,b)=>a-b)
            }
            init(object)
            `
            await testRunner(func, copies, original)
        })

    })
    describe('OBJECTS', () => {
        it('case #1: normal prop assignment', async () => {
            const original = {}
            const copies = getCopies(original)
            const func = `
                function init(obj){
                    obj.hello = 1;
                    return obj
                }
                init(object)
            `
            await testRunner(func, copies, original)
        })
        it('case #2: deletion', async () => {
            const original = { prop: null }
            const copies = getCopies(original)
            const func = `
                function init(obj){
                    obj.hello = null;
                    delete obj.prop
                    return obj
                }
                init(object)
            `
            await testRunner(func, copies, original)
        })
        it('case #3: Object.assign', async () => {
            const original = { prop0: 0 }
            const copies = getCopies(original)
            const func = `
            const other1 = { prop1: 1 }
            const other2 = { prop2: 2 }
            const other3 = { prop0: 3 } 
            function init(obj){
                Object.assign(obj, other1, other2, other3)
                return obj
            }
            init(object)
        `
            await testRunner(func, copies, original)
        })
    })
})