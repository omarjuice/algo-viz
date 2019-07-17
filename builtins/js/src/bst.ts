import BTree from './btree'

class BST {
    value: any
    left: null | BST
    right: null | BST
    constructor(val: any) {
        this.value = val
        this.left = this.right = null
    }
    static create(elems: any[], method: 'inOrder' | 'binary') {
        if (!Array.isArray(elems)) throw new Error('elems must be an array')
        if (!elems.length) throw new Error('elems must have a length of at least 1')

        if (method === 'inOrder') {
            const bst = new BST(elems[0])
            for (let i = 1; i < elems.length; i++) {
                if (i in elems) {
                    bst.insert(elems[i])
                }
            }
            return bst
        } else if (method === 'binary') {
            function helper(elems: any[], left: number, right: number, cb: (val: any) => any): void {
                if (left >= right) {
                    return null
                }
                const middle = Math.floor((left + right) / 2)
                cb(elems[middle])
                helper(elems, left, middle, callback)
                helper(elems, middle + 1, right, callback)
            }
            const middle = Math.floor(elems.length / 2)
            const bst = new BST(elems[middle])
            const callback = (val: any) => bst.insert(val)
            helper(elems, 0, middle, callback)
            helper(elems, middle + 1, elems.length, callback)
            return bst
        } else {
            throw new Error('Method must be "breadth" or "binary"')
        }
    }
    insert(val: any): BST {
        if (val >= this.value) {
            if (this.right) this.right.insert(val)
            else this.right = new BST(val)
        } else {
            if (this.left) this.left.insert(val)
            else this.left = new BST(val)
        }
        return this
    }
    traverse(callback: (val: any) => any, order: 'inOrder' | 'postOrder' | 'preOrder' | 'breadthFirst', seen?: any) {
        return BTree.prototype.traverse.call(this, callback, order, seen)
    }
}

export default BST

