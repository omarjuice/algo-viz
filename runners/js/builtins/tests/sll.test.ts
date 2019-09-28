import expect from 'expect'
import SLL from '../src/sll';
import instantiateViz from '../src';
const Viz = instantiateViz()

describe('Singly Linked List', () => {
    describe('create', () => {
        it('Should create a new SLL', () => {
            const arr = [1, 2, 3, 4, 5]
            const list = Viz.SLL.create(arr)
            let i = 0
            let current: any = list
            while (current) {
                expect(current.value).toBe(arr[i])
                i++
                current = current.next
            }
            expect(i).toBe(5)
        })
    })
    describe('toArray', () => {
        it('Should convert an SLL to an array', () => {
            const arr = [1, 2, 3, 4, 5]
            const list = Viz.SLL.create(arr)
            const elems = Viz.SLL.toArray(list)
            expect(elems).toEqual(arr)
        })
    })
    describe('reverse', () => {
        it('Should reverse an SLL', () => {
            const arr = [1, 2, 3, 4, 5]
            const list = Viz.SLL.create(arr)
            const reversed = Viz.SLL.reverse(list)
            expect(reversed).toBeTruthy()
            if (reversed) expect(Viz.SLL.toArray(reversed))
        })
    })
})