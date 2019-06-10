const isNative = require('../utils/isNative')
const stringifier = require('../utils/stringify')
const randomString = require('../utils/randomString')
const isArray = require('../utils/isArray')
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
    describe('isArray', () => {
        it('Should return true for regular array', () => {
            expect(isArray(new Array(10))).toBe(true)
            expect(isArray([])).toBe(true)
        })
        it('Should return true for typed Arrays', () => {
            expect(isArray(new Int32Array(10))).toBe(true)
            expect(isArray(new Int16Array(10))).toBe(true)
            expect(isArray(new Int8Array(10))).toBe(true)
            expect(isArray(new Uint32Array(10))).toBe(true)
            expect(isArray(new Uint16Array(10))).toBe(true)
            expect(isArray(new Uint8Array(10))).toBe(true)
            expect(isArray(new Uint8ClampedArray(10))).toBe(true)
            expect(isArray(new Float32Array(10))).toBe(true)
            expect(isArray(new BigInt64Array(10))).toBe(true)
            expect(isArray(new BigUint64Array(10))).toBe(true)
            expect(isArray(new Float64Array(10))).toBe(true)
        })
        it('returns false for array like objects and other objects', () => {
            function func() {
                expect(isArray(arguments)).toBe(false)
            }
            func()

            expect(isArray({})).toBe(false)
            expect(isArray('Int8Array')).toBe(false)
        })

    })
})