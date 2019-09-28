import 'mocha'
import instantiateViz from '../src'
import expect from 'expect'
const Viz = instantiateViz()


describe('Queue', () => {
    describe('construction', () => {
        it('Should construct a queue without items', () => {
            const queue = new Viz.Queue()
            expect(queue.length).toBe(0)
        })
        it('Should create a queue with provided items', () => {
            const queue = new Viz.Queue([1, 2, 3, 4, 5])
            expect(queue.length).toBe(5)
        })
    })
    describe('push', () => {
        it('Should add elements to the end of the queue', () => {
            const queue = new Viz.Queue([1])
            queue.push(10)
            expect(queue.length).toBe(2)
        })
        it('Should add an item to an empty queue', () => {
            const queue = new Viz.Queue()
            queue.push(1)
            expect(queue.length).toBe(1)

        })
        it('Should add multiple items', () => {
            const items = [1, 2, 3, 4, 5]
            const queue = new Viz.Queue()
            queue.push(...items)
            expect(queue.length).toBe(5)

            while (queue.length !== 1) {
                expect(items.shift()).toBe(queue.shift())
            }
            expect(queue.shift()).toBe(5)
        })
    })
    describe('shift', () => {
        it('Should remove elements from the front of the queue', () => {
            const items = [1, 2, 3, 4, 5]
            const queue = new Viz.Queue(items)
            let length = 5
            for (const item of items) {
                expect(queue.shift()).toBe(item)
                expect(queue.length).toBe(--length)
            }
        })
    })
    describe('unshift', () => {
        it('Should add elements to the front of the queue', () => {
            const queue = new Viz.Queue([1])
            queue.unshift(2)
            expect(queue.shift()).toBe(2)
            expect(queue.shift()).toBe(1)
            expect(queue.shift()).toBe(undefined)

        })
        it('Should add an item to an empty queue', () => {
            const queue = new Viz.Queue()
            queue.unshift(100)
            expect(queue.shift()).toBe(100)
        })
        it('Should add multiple items', () => {
            const queue = new Viz.Queue([6])
            const items = [1, 2, 3, 4, 5]
            queue.unshift(...items)
            expect(queue.length).toBe(6)
            while (queue.length !== 1) {
                expect(items.shift()).toBe(queue.shift())
            }
            expect(queue.shift()).toBe(6)
        })
    })
    describe('pop', () => {
        it('Should remove elements from the end of the queue', () => {
            const items = [1, 2, 3, 4, 5]
            const queue = new Viz.Queue(items)
            let length = 5
            for (const item of items.reverse()) {
                expect(queue.pop()).toBe(item)
                expect(queue.length).toBe(--length)
            }
        })
    })
    describe('values', () => {
        it('Should allow iteration of the queue', () => {
            const items = [1, 2, 3, 4, 5]
            const queue = new Viz.Queue(items)

            for (const v of queue.values()) {
                expect(v).toBe(items.shift())
            }

        })
        it('Should finish if the queue is empty', () => {
            const items: any[] = []
            const queue = new Viz.Queue(items)

            for (const v of queue.values()) {
                throw new Error('Iterating when you should not be!')
            }
        })
    })

})