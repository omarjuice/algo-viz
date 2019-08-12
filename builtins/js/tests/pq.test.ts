import 'mocha'
import instantiateViz from '../src'
import expect from 'expect'
const Viz = instantiateViz()

describe.only('PQ(Priority Queue)', () => {
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
})