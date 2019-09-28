import 'mocha'
import expect from 'expect'
import instantiateViz from '../src';

const Viz = instantiateViz()

describe('Binary Tree', () => {
    describe('create', () => {
        it('breadth', () => {
            const elems = [1, 2, 3, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]
            const btree = Viz.BTree.create(elems, 'inOrder')
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