import { Runner } from '.';

export default function instantiateBTree(runner: Runner = { ignore: () => { } }) {
    return class BTree {
        left: BTree | null
        right: BTree | null
        value: any
        private static traversalTypes = ['inOrder', 'postOrder', 'preOrder', 'breadthFirst']
        constructor(value: any) {
            this.value = value
            this.right = null
            this.left = null
        }
        static create(elems: any[], method: 'inOrder' | 'binary' = 'inOrder') {
            if (!Array.isArray(elems)) throw new Error('Viz.BTree.create: elems must be an array')
            if (!elems.length) return null
            if (method !== 'inOrder' && method !== 'binary') throw new Error(`Viz.BTree.create: Method must be "inOrder" or "binary". Received ${method}`)
            runner.ignore(true)
            elems = [...elems]
            runner.ignore(false)
            if (method === 'inOrder') {
                const tree = new BTree(elems[0])
                let cur, next;
                const dq = [tree]
                let size = 0, index = 1;
                while (dq.length) {
                    size = dq.length
                    for (let i = 0; i < size; i++) {
                        cur = dq.shift()
                        for (let j = index; j < index + 2 && j < elems.length; j++) {
                            if (elems[j] === null) {
                                if (j % 2 === 1) {
                                    cur.left = null
                                } else {
                                    cur.right = null
                                }
                            } else {
                                next = new BTree(elems[j])
                                dq.push(next)
                                if (j % 2 === 1) {
                                    cur.left = next
                                } else {
                                    cur.right = next
                                }
                            }
                        }
                        index += 2
                    }
                }
                return tree
            } else if (method === 'binary') {

                function helper(elems: any[], left: number, right: number) {
                    if (left >= right) {
                        return null
                    }
                    const middle = Math.floor((left + right) / 2)
                    const btree = new BTree(elems[middle])
                    btree.left = helper(elems, left, middle)
                    btree.right = helper(elems, middle + 1, right)
                    return btree
                }


                return helper(elems, 0, elems.length)
            }
        }
        traverse(callback: (val: any) => any, order: 'inOrder' | 'postOrder' | 'preOrder' | 'breadthFirst', seen?: any) {
            if (!BTree.traversalTypes.includes(order)) {
                throw new Error('Viz.BTree.traverse: traversal order must be one of ' + BTree.traversalTypes.join(', '))
            }
            if (typeof callback !== 'function') {
                throw new Error('Viz.BTree.traverse: Callback must be a function')
            }
            if (!seen || !(seen instanceof Set)) {
                seen = new Set()
            }
            if (seen.has(this)) {
                throw new Error('Viz.BTree.traverse: Cannot traverse cyclic trees')
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
                    if (seen.has(current) && current !== this) throw new Error('Viz.BTree.traverse: Cannot traverse cyclic trees')
                    seen.add(current)
                    callback(current.value)
                    if (current.left && current.left instanceof this.constructor) queue.push(current.left)
                    if (current.right && current.right instanceof this.constructor) queue.push(current.right)
                }
            }
            return this
        }
    }
}
