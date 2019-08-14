import array from './array'
import instantiateSLL from './sll';
import instantiateDLL from './dll'
import instantiateBTree from './btree'
import instantiateBST from './bst';
import instantiateQueue from './queue';
import instantiatePQ from './pq';
import Node from './node';
import instantiateTree from './tree';
import Leaf from './leaf';
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
        static Queue = instantiateQueue(runner)
        static PQ = instantiatePQ(runner)
        static Tree = instantiateTree(runner)
        static Node = Node
        static Leaf = Leaf
    }

    runner.Viz = Viz
    return Viz
}


