import 'mocha'
import Viz from '../src'
import expect from 'expect'


describe('BST', () => {
    describe('create', () => {
        it('Should create a new bst', () => {
            const elems = Viz.array.sortedInts(15, false)
            const elemsCopy = [...elems]
            const bst = Viz.BST.create(elems, 'binary')
            const arr: any[] = []
            bst.traverse((val) => {
                arr.push(val)
            }, 'inOrder')
            expect(arr).toEqual(elemsCopy.sort((a, b) => a - b))
        })
    })
})