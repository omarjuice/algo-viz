declare class Viz {
    array: array
    SLL: SLL
}

declare class SLL {
    next: null | SLL
    value: any
}
declare class DLL {
    next: null | DLL
    prev: null | DLL
    value: any
}
declare type array = {
    sortedInts: (length: number) => number[]
}
declare class BTree {
    left: BTree | null
    right: BTree | null
    value: any
    traverse: (callback: (v: number) => void, order: 'inOrder' | 'postOrder' | 'preOrder' | 'breadthFirst')
}
declare class BST {
    left: BST | null
    right: BST | null
    insert: (v: number) => BST
    remove: (v: number) => BST

}
