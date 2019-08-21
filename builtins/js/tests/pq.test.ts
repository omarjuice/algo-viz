import 'mocha'
import instantiateViz from '../src'
import expect from 'expect'
const Viz = instantiateViz()

describe('PQ(Priority Queue)', () => {
    describe('construction', () => {
        it('should create a priority queue', () => {
            {
                const items = Viz.array.randomInts(10, false);
                const pq = new Viz.PQ(items);
                const values = []
                while (pq.size) {
                    values.push(pq.remove())
                }
                items.sort((a, b) => a - b)
                expect(values).toEqual(items)
            }

            {
                const items = Viz.array.randomInts(10, false);
                const pq = new Viz.PQ(items, (a, b) => a > b);
                const values = []
                while (pq.size) {
                    values.push(pq.remove())
                }
                items.sort((a, b) => b - a)
                expect(values).toEqual(items)
            }
        })
        it('Should create a priority queue without items', () => {
            const pq = new Viz.PQ((a, b) => {
                return a.key > b.key
            })

            const objs = Viz.array.randomInts(10, false).map(key => ({ key }))

            for (const obj of objs) {
                pq.insert(obj)
            }
            objs.sort((a, b) => b.key - a.key)
            const values = []
            while (pq.size) {
                values.push(pq.remove())
            }
            expect(values).toEqual(objs)

        })

    })
    describe('findAndRemove O(n)', () => {
        it('Should remove an arbitary element from the pq', () => {
            const elements = [6, 5, 1, 2, 3, 4]
            const pq = new Viz.PQ(elements);
            pq.findAndRemove(2);

            const vals = [1, 3, 4, 5, 6]
            const elems = []
            while (pq.size) {
                elems.push(pq.remove())
            }
            expect(elems).toEqual(vals);
        })
    })
})