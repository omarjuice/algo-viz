const isNative = require('../utils/isNative')
const stringifier = require('../utils/stringify')
const randomString = require('../utils/randomString')
const genId = () => '___' + randomString(5)
const reassignMutative = () => ({
    reassignArrayMethods: () => { }, reassignMapMethods: () => { }, reassignSetMethods: () => { }
})
describe('isNative', () => {
    test('Should detect native objects', () => {
        expect(isNative(Object)).toBe('Object')
    })
    test('Should not flag instances', () => {
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

    test('does not throw errors', () => {
        const map = new Map()
        const objects = {}
        const obj = new Circular
        expect(() => stringifier({
            obj, objects, map, genId,
            defProp: (obj, key, val) => Object.defineProperty(obj, key, { val }),
            reassignMutative

        })(obj)).not.toThrow()


    })
    test('Primitive values remain intact and refs are created for objects', () => {
        const map = new Map()
        const objects = {}
        const obj = new Circular
        const types = {}
        const stringify = stringifier({
            map, objects, types,
            defProp: (obj, key, val) => Object.defineProperty(obj, key, { val }),
            genId,
            reassignMutative
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