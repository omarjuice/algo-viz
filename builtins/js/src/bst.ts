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
    remove(value: any, parent: BST | null = null): BST {
        if (value < this.value) {
            this.left.remove(value, this)
        } else if (value > this.value) {
            this.right.remove(value, this)
        } else {
            if (this.left instanceof BST && this.right instanceof BST) {
                this.value = this.right.getMinValue()
                this.right.remove(this.value, this)
            } else if (parent === null) {
                if (this.left instanceof BST) {
                    this.value = this.left.value
                    this.right = this.left.right
                    this.left = this.left.left
                } else if (this.right instanceof BST) {
                    this.value = this.right.value
                    this.left = this.right.left
                    this.right = this.right.right
                } else {
                    this.value = null
                }
            } else if (parent.left === this) {
                parent.left = this.left !== null ? this.left : this.right
            } else if (parent.right === this) {
                parent.right = this.left !== null ? this.left : this.right
            }
        }
        return this
    }
    private getMinValue(): any {
        if (!(this.left instanceof BST)) {
            return this.value
        } else {
            return this.left.getMinValue()
        }
    }
    traverse(callback: (val: any) => any, order: 'inOrder' | 'postOrder' | 'preOrder' | 'breadthFirst', seen?: any) {
        return BTree.prototype.traverse.call(this, callback, order, seen)
    }
}

export default BST

