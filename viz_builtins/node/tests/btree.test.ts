import 'mocha'
import Viz from '../src'
import expect from 'expect'


describe('Binary Tree', () => {
    describe('create', () => {
        it('breadth', () => {
            const elems = [1, 2, 3, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]
            const btree = Viz.BTree.create(elems, 'breadth')
            const array: any[] = []
            btree.traverse((val) => array.push(val), 'breadthFirst')
            expect(array).toEqual(elems)
        })
        it('binary', () => {
            const elems = [1, 2, 3, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]
            const btree = Viz.BTree.create(elems, 'binary')
            const array: any[] = []
            btree.traverse((val) => array.push(val), 'inOrder')
            expect(array).toEqual(elems)
        })
    })
})