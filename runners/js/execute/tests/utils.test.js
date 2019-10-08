const expect = require('expect')
const checkBanned = require('../utils/checkBanned')
const Runner = require('../runner')
describe('UTILS', () => {


    describe('stringify', () => {
        class Circular {
            constructor() {
                this.value = this
                this.array = [this]
                this.object = { value: this }
                this.object.obj = this.object
                this.val = 'VALUE'
                this.notCircular = { hello: true }
                this.arr = [1, 2, 3, this.notCircular]
                this.arrContainer = [this.arr]
            }
        }

        it('does not throw errors', () => {
            const runner = new Runner('_name')
            runner.setGlobal(global)
            expect(() => runner.stringify(new Circular)).not.toThrow()


        })
        it('Primitive values remain intact, refs are created for objects', () => {
            const runner = new Runner('_name')
            runner.setGlobal(global)
            const obj = new Circular
            runner.stringify(obj)
            const copy = runner.objects[runner.map.get(obj)]
            for (let key in obj) {
                if (typeof obj[key] === 'object') {
                    expect(typeof copy[key]).toBe('string')
                    expect(copy[key].slice(0, 3)).toBe('___')
                } else {
                    expect(copy[key]).toBe(obj[key])
                }
            }
        })
    })
    describe('checkBanned', () => {

        const runner = new Runner('_name')
        runner.setGlobal(global)
        const check = checkBanned(runner)

        it('Should not throw for regular array', () => {
            expect(() => check(new Array(10))).not.toThrow()
        })
        it('Should throw for typed arrays', () => {
            expect(() => check(new Int32Array(10))).toThrow()
            expect(() => check(new Int16Array(10))).toThrow()
            expect(() => check(new Int8Array(10))).toThrow()
            expect(() => check(new Uint32Array(10))).toThrow()
            expect(() => check(new Uint16Array(10))).toThrow()
            expect(() => check(new Uint8Array(10))).toThrow()
            expect(() => check(new Uint8ClampedArray(10))).toThrow()
            expect(() => check(new Float32Array(10))).toThrow()
            expect(() => check(new BigInt64Array(10))).toThrow()
            expect(() => check(new BigUint64Array(10))).toThrow()
            expect(() => check(new Float64Array(10))).toThrow()
        })
        it('does not throw for array like objects and other things', () => {
            function func() {
                expect(() => check(arguments)).not.toThrow()
            }
            func()

            expect(() => check({})).not.toThrow()
            expect(() => check('Int8Array')).not.toThrow()
        })

    })
})