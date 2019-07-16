
import Viz from '../src'
import expect from 'expect'

describe('Viz.Array', () => {
    describe('sortedInts', () => {
        it('Should produce a sorted array', () => {
            const result = Viz.array.sortedInts(9)
            expect(result.length).toBe(9)
            let curr = result[0]
            for (let i = 1; i < result.length; i++) {
                expect(result[i] >= curr).toBe(true)
                curr = result[i]
            }
        })
    })
})