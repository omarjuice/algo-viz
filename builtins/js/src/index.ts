import array from './array'
import instantiateSLL from './sll';
import instantiateDLL from './dll'
import instantiateBTree from './btree'
import instantiateBST from './bst';
export type Runner = {
    [key: string]: any
    ignore: (bool: boolean) => void
}

export default function instantiateViz(runner: Runner = { ignore: () => { } }) {
    class Viz {
        static array = array
        static SLL = instantiateSLL(runner)
        static DLL = instantiateDLL(runner)
        static BTree = instantiateBTree(runner)
        static BST = instantiateBST(runner)
    }

    runner.Viz = Viz
    return Viz
}


