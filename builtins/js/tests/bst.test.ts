import 'mocha'
import Viz from '../src'
import expect from 'expect'


describe('BST', () => {
    describe('create', () => {
        it('Should create a new bst', () => {
            const elems = Viz.array.randomInts(15)
            const bst = Viz.BST.create(elems, 'inOrder')
            const arr: any[] = []
            bst.traverse((val) => {
                arr.push(val)
            }, 'inOrder')
            expect(arr).toEqual(elems.sort((a, b) => a - b))
        })
    })
})