declare class Viz {
    array: array
    SLL: SLL
    DLL: DLL
    BTree: BTree
    BST: BST
}

declare class SLL {
    next: null | SLL
    value: any
    static create: (vals: any[]) => SLL
    static reverse: (list: SLL) => SLL
    static forEach: (list: SLL, callback: (v: any) => void) => void
    static toArray: (list: SLL) => any[]
}
declare class DLL {
    next: null | DLL
    prev: null | DLL
    value: any
    static create: (vals: any[]) => DLL
    static reverse: (list: DLL) => DLL
    static forEach: (list: DLL, callback: (v: any) => void) => void
    static toArray: (list: DLL) => any[]
}
declare type array = {
    sortedInts: (length: number, randomize: boolean) => number[]
    randomints: (length: number, allowNegative: boolean) => number[]
    filterDuplicates: (array: any[], mutate: boolean) => any[]
    matrix: (rows: number, cols: number, callbackOrVal: ((i: number, j: number) => any) | any) => any[][]
}

type treeTraversalMethod = 'inOrder' | 'postOrder' | 'preOrder' | 'breadthFirst'
type binaryTreeInsertionMethod = 'inOrder' | 'binary'
declare class BTree {
    left: BTree | null
    right: BTree | null
    value: any
    static create: (vals: number[], method: binaryTreeInsertionMethod) => BTree
    traverse: (callback: (v: number) => void, order: treeTraversalMethod) => void
}

declare class BST {
    left: BST | null
    right: BST | null
    static create: (vals: number[], method: binaryTreeInsertionMethod) => BST
    insert: (v: number) => BST
    insertMany: (vals: number[], method: binaryTreeInsertionMethod) => BST
    remove: (v: number) => BST
    traverse: (callback: (v: number) => any, method: treeTraversalMethod) => BST
}

declare class Node {
    value: any
    prev: Node
    next: Node
}

declare class Queue {
    private front: Node
    private end: Node
    public length: number
    push: (...values) => number
    unshift: (...values) => number
    shift: () => any
    pop: () => any
    values: () => IterableIterator<any>
    toArray: () => any[]
}

declare class PQ {
    private _compare: (a: any, b: any) => boolean
    size: number
    private heap: any[]
    insert: (val: any) => PQ
    remove: () => any
    peek: () => any
    clear: () => PQ
    values: () => IterableIterator<any>
    toArray: () => any[]
}

declare class Trie {
    value: string
    isWord: boolean
    children: Map<string, Trie>
    static create: (words: string[]) => Trie
    add: (word: string) => Trie
    remove: (word: string) => Trie
    find: (word: string) => Trie
    findWords: (prefix: string) => string[]
    addMany: (words: string[]) => Trie
}