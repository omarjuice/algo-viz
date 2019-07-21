import 'mocha'
import expect from 'expect'
import instantiateViz from '../src';

const Viz = instantiateViz()

describe('Doubly Linked List', () => {
    describe('create', () => {
        it('Should create a new DLL', () => {
            const elems = [1, 2, 3, 4, 5]
            const list = Viz.DLL.create(elems)
            let current = list, prev = null, i = 0;
            while (current) {
                expect(current.value).toBe(elems[i])
                expect(current.prev).toBe(prev)
                prev = current
                current = current.next
                i++
            }
            expect(i).toBe(5)
        })
    })
    describe('toArray', () => {
        it('Should convert a DLL to an array', () => {
            const elems = [1, 2, 3, 4, 5]
            const list = Viz.DLL.create(elems)
            const array = Viz.DLL.toArray(list)
            expect(array).toEqual(elems)
        })
    })
})