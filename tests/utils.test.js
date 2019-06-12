const isNative = require('../utils/isNative')
const stringifier = require('../utils/stringify')
const randomString = require('../utils/randomString')
const checkTypedArray = require('../utils/checkTypedArray')
const expect = require('expect')
const genId = () => '___' + randomString(5)
const reassignMutative = () => ({
    reassignArrayMethods: () => { }, reassignMapMethods: () => { }, reassignSetMethods: () => { }
})
describe('UTILS', () => {
    describe('isNative', () => {
        it('Should detect native objects', () => {
            expect(isNative(Object)).toBe('Object')
        })
        it('Should not flag instances', () => {
            expect(isNative(new Object)).toBe(undefined)
        })
    })

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
            const map = new Map()
            const objects = {}
            const obj = new Circular
            expect(() => stringifier({
                obj, objects, map, genId,
                defProp: (obj, key, val) => Object.defineProperty(obj, key, { val }),
                reassignMutative,
                constructors: new Map()

            })(obj)).not.toThrow()


        })
        it('Primitive values remain intact, refs are created for objects', () => {
            const map = new Map()
            const objects = {}
            const obj = new Circular
            const types = {}
            const stringify = stringifier({
                map, objects, types,
                defProp: (obj, key, val) => Object.defineProperty(obj, key, { val }),
                genId,
                reassignMutative,
                constructors: new Map()
            })
            stringify(obj)
            const copy = objects[map.get(obj)]
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
    describe('checkTypedArray', () => {
        it('Should not throw for regular array', () => {
            expect(() => checkTypedArray(new Array(10))).not.toThrow()
        })
        it('Should throw for typed arrays', () => {
            expect(() => checkTypedArray(new Int32Array(10))).toThrow()
            expect(() => checkTypedArray(new Int16Array(10))).toThrow()
            expect(() => checkTypedArray(new Int8Array(10))).toThrow()
            expect(() => checkTypedArray(new Uint32Array(10))).toThrow()
            expect(() => checkTypedArray(new Uint16Array(10))).toThrow()
            expect(() => checkTypedArray(new Uint8Array(10))).toThrow()
            expect(() => checkTypedArray(new Uint8ClampedArray(10))).toThrow()
            expect(() => checkTypedArray(new Float32Array(10))).toThrow()
            expect(() => checkTypedArray(new BigInt64Array(10))).toThrow()
            expect(() => checkTypedArray(new BigUint64Array(10))).toThrow()
            expect(() => checkTypedArray(new Float64Array(10))).toThrow()
        })
        it('does not throw for array like objects and other things', () => {
            function func() {
                expect(() => checkTypedArray(arguments)).not.toThrow()
            }
            func()

            expect(() => checkTypedArray({})).not.toThrow()
            expect(() => checkTypedArray('Int8Array')).not.toThrow()
        })

    })
})