class BTree {
    left: BTree | null
    right: BTree | null
    value: any
    private static traversalTypes = ['inOrder', 'postOrder', 'preOrder', 'breadthFirst']
    constructor(value: any) {
        this.value = value
        this.right = null
        this.left = null
    }
    static create(elems: any[], method: 'breadth' | 'binary') {
        if (!Array.isArray(elems)) throw new Error('elems must be an array')
        if (!elems.length) throw new Error('elems must have a length of at least 1')

        if (method === 'breadth') {
            const btree = new BTree(elems[0])
            const queue = [btree]
            for (let i = 1; i < elems.length; i += 2) {
                const current = queue.shift()
                if (current) {
                    if (i in elems && elems[i] !== null) {
                        current.left = new BTree(elems[i])
                        queue.push(current.left)
                    } else {
                        queue.push(null)
                    }
                    if (i + 1 in elems && elems[i + 1] !== null) {
                        current.right = new BTree(elems[i + 1])
                        queue.push(current.right)
                    } else {
                        queue.push(null)
                    }
                } else {
                    queue.push(null, null)
                }
            }
            return btree
        } else if (method === 'binary') {
            function helper(elems: any[], left: number, right: number) {
                if (left >= right) {
                    return null
                }
                const middle = Math.floor((left + right) / 2)
                const bst = new BTree(elems[middle])
                bst.left = helper(elems, left, middle)
                bst.right = helper(elems, middle + 1, right)
                return bst
            }
            return helper(elems, 0, elems.length)
        } else {
            throw new Error('Method must be "breadth" or "binary"')
        }
    }
    traverse(callback: (val: any) => any, order: 'inOrder' | 'postOrder' | 'preOrder' | 'breadthFirst', seen?: any) {
        if (!BTree.traversalTypes.includes(order)) {
            throw new Error('traversal order must be one of ' + BTree.traversalTypes.join(', '))
        }
        if (typeof callback !== 'function') {
            throw new Error('Callback must be a function')
        }
        if (!seen || !(seen instanceof Set)) {
            seen = new Set()
        }
        if (seen.has(this)) {
            throw new Error('Cannot traverse cyclic trees')
        }
        seen.add(this)
        if (order === 'inOrder') {
            if (this.left && this.left instanceof this.constructor) this.left.traverse(callback, order, seen)
            callback(this.value)
            if (this.right && this.right instanceof this.constructor) this.right.traverse(callback, order, seen)
        } else if (order === 'postOrder') {
            if (this.left && this.left instanceof this.constructor) this.left.traverse(callback, order, seen)
            if (this.right && this.right instanceof this.constructor) this.right.traverse(callback, order, seen)
            callback(this.value)
        } else if (order === 'preOrder') {
            callback(this.value)
            if (this.left && this.left instanceof this.constructor) this.left.traverse(callback, order, seen)
            if (this.right && this.right instanceof this.constructor) this.right.traverse(callback, order, seen)
        } else if (order === 'breadthFirst') {
            const queue: BTree[] = [this]
            while (queue.length) {
                const current = queue.shift()
                if (seen.has(current) && current !== this) throw new Error('Cannot traverse cyclic trees')
                seen.add(current)
                callback(current.value)
                if (current.left && current.left instanceof this.constructor) queue.push(current.left)
                if (current.right && current.right instanceof this.constructor) queue.push(current.right)
            }
        }
        return this
    }
}
export default BTree
