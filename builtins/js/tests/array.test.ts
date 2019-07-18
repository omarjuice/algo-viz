import 'mocha'
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
    describe('filterDuplicates', () => {
        it('Should filter duplicates without mutating', () => {
            const arr = [1, 1, 2, 3, 4, 4, 5, 5]
            const result = Viz.array.filterDuplicates(arr, false)
            expect(result).not.toBe(arr)
            const set = new Set()
            for (const el of result) {
                expect(set.has(el)).toBe(false)
                set.add(el)
            }
        })
        it('Should filter duplicates  mutatively', () => {
            const arr = [1, 1, 2, 3, , 4, 5, 5, , 5, 6, 7, 8]
            const result = Viz.array.filterDuplicates(arr)
            expect(result).toBe(arr)
            const set = new Set()
            for (const el of result) {
                expect(set.has(el)).toBe(false)
                set.add(el)
            }
        })
    })
    describe('matrix', () => {
        it('should create a matrix', () => {
            const rows = 5
            const cols = 4
            const matrix = Viz.array.matrix(rows, cols)
            expect(matrix.length).toBe(rows)
            expect(matrix[0].length).toBe(cols)
            matrix.forEach(row => {
                row.forEach(el => {
                    expect(typeof el).toBe('number')
                })
            })
        })
        it('should work with a custom callback', () => {
            const rows = 5
            const cols = 5
            const matrix = Viz.array.matrix(rows, cols, (i, j) => Math.random() > .5 ? null : 1)
            matrix.forEach(row => {
                row.forEach(el => {
                    expect(el === 1 || el === null).toBe(true)
                })
            })
        })
    })
})