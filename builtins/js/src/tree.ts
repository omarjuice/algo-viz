import { Runner } from ".";
import Leaf from './leaf';
export default function instantiateTree(runner: Runner) {
    return class Tree {
        key: string
        children: { [key: string]: Tree }
        leaf: Leaf
        constructor(...args: [string?, any?]) {
            const key = String(args[0])
            this.key = key;
            if (1 in args) {
                this.leaf = new Leaf(args[1])
            } else {
                this.children = {}
            }
        }
        insert(key: string) {
            this.children[key] = new Tree(key)
            return this.children[key]
        }
        remove(key: string) {
            delete this.children[key]
        }
        insertLeaf(key: string, value: any) {
            this.children[key] = new Tree(key, value)
            return this
        }
        static create(obj: { [key: string]: any }) {

            function helper(object: { [key: string]: any }, key: string = "", seen = new Set()): Tree {
                if (seen.has(object)) return;
                seen.add(object)
                const tree = new Tree(key);
                for (const k in object) {
                    const val = object[k]
                    if (val && typeof val === 'object') {
                        tree.children[k] = helper(val, k, seen)
                    } else {
                        tree.children[k] = new Tree(k, val)
                    }
                }
                return tree
            }
            runner.ignore(true)
            const t: Tree = helper(obj)
            runner.ignore(false)
            return t
        }
        // static from(obj: { [key: string]: any }) {
        //     function helper(object: { [key: string]: any }, key: string = "", seen = new Set()): Tree {
        //         if (seen.has(object)) return;
        //         seen.add(object)
        //         const tree = new Tree(key);
        //         for (const k in object) {
        //             const val = object[k]
        //             if (val && typeof val === 'object') {
        //                 tree.children[k] = helper(val, k, seen)
        //             } else {
        //                 tree.children[k] = new Tree(k, val)
        //             }
        //         }
        //         runner.stringify(tree)
        //         runner.virtualize(tree)
        //         const _tree = new Proxy(tree, {
        //             get(target, prop: string) {
        //                 return target.children[prop]
        //             },
        //             set(target, k: string, val) {
        //                 if (val && typeof val === 'object') {
        //                     target.children[k] = Tree.from(val)
        //                 } else {
        //                     target.children[k] = new Tree(k, val)
        //                 }
        //                 return true
        //             }
        //         })
        //         runner.virtualize(_tree)
        //         runner.stringify(_tree)
        //         runner.map.set(_tree, runner.map.get(tree))
        //         return _tree
        //     }
        //     runner.ignore(true)
        //     const t: Tree = helper(obj)
        //     runner.ignore(false)
        //     return t
        // }


    }


}
