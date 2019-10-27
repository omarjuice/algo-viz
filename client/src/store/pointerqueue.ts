import { observable, computed, action } from "mobx";
import Structures from './structures';
type types = { [key: string]: string }
type parents = { [id: string]: string }
type baseTypes = 'unconfigurables' | 'hashTypes' | 'arrayTypes' | 'setTypes' | 'mapTypes' | 'viableParents'
class PointerQueue {
    @observable heap: Viz.objectPointer[] = []
    parents: parents
    types: types
    map: { [id: string]: Map<string | number, number> }
    id: string
    structs: Structures
    baseTypes: {
        [key in baseTypes]: Set<string>
    }
    constructor(structs: Structures, id: string) {
        this.types = structs.root.viz.types;
        const settings = structs.root.settings
        this.baseTypes = {
            unconfigurables: settings.unconfigurables,
            hashTypes: settings.hashTypes,
            arrayTypes: settings.arrayTypes,
            mapTypes: settings.mapTypes,
            setTypes: settings.setTypes,
            viableParents: settings.viableParents
        }
        this.parents = structs.parents;
        this.structs = structs;
        this.id = id
        this.map = {}
    }
    private _compare(a: Viz.objectPointer, b: Viz.objectPointer, idxs: [number, number]): boolean {
        if (a.affinity === b.affinity) {
            if (a.index === b.index) {
                return a.key < b.key
            }
            return a.index < b.index
        }
        return a.affinity > b.affinity

    }
    @action private swap(i: number, j: number) {
        const tmp = this.heap[i];
        this.heap[i] = this.heap[j];
        this.heap[j] = tmp;
        this.map[this.heap[i].id].set(this.heap[i].key, i)
        this.map[this.heap[j].id].set(this.heap[j].key, j)
    }
    @computed get size() {
        return this.heap.length;
    }
    @computed get top() {
        return this.heap.length ? this.heap[0] : null
    }
    @action private _siftUp(idx: number) {
        let parent = Math.floor((idx - 1) / 2)

        while (idx > 0 && this._compare(this.heap[idx], this.heap[parent], [idx, parent])) {
            this.swap(idx, parent);
            idx = parent;
            parent = Math.floor((idx - 1) / 2)
        }
    }
    @action private _siftDown(idx: number, end: number) {
        let child1 = idx * 2 + 1

        while (child1 <= end) {
            const child2 = idx * 2 + 2 <= end ? idx * 2 + 2 : -1;
            let swapIdx = child1
            if (child2 !== -1 && this._compare(this.heap[child2], this.heap[child1], [child2, child1])) {
                swapIdx = child2
            }
            if (this._compare(this.heap[swapIdx], this.heap[idx], [swapIdx, idx])) {
                this.swap(idx, swapIdx)
                idx = swapIdx;
                child1 = idx * 2 + 1
            } else {
                return
            }
        }
    }

    @action insert(key: string | number, parentId: string, index: number) {

        const affinity = this.getAffinity(parentId, this.id)
        if (parentId in this.map) {
            if (this.map[parentId].has(key)) return this
        }
        if (parentId !== this.id && affinity > 0) {
            this.heap.push({
                key,
                id: parentId,
                index,
                affinity
            });
            if (!(parentId in this.map)) {
                this.map[parentId] = new Map([[key, this.heap.length - 1]])
            } else {
                this.map[parentId].set(key, this.heap.length - 1)
            }
            this._siftUp(this.heap.length - 1);
        } else {
            this.structs.childKeyMemo[parentId].delete(key)
        }
        return this
    }
    @action findAndRemove(parentId: string, key: string | number): any {
        const parentKeys = this.map[parentId]
        if (!parentKeys) return null;
        const i = parentKeys.get(key)
        if (typeof i !== 'number') {
            return null;
        }
        const pointer = this.heap[i]
        if (i === this.heap.length - 1) {
            this.heap.pop()
        } else {
            this.swap(i, this.heap.length - 1);
            this.heap.pop()
            if (this.size > 1) {
                const parent = Math.trunc((i - 1) / 2);
                if (this._compare(this.heap[i], this.heap[parent], [i, parent])) {
                    this._siftUp(i);
                } else {
                    this._siftDown(i, this.heap.length - 1);
                }
            }
        }
        this.map[parentId].delete(key);
        if (!this.map[parentId].size) {
            delete this.map[parentId]
        }

        return pointer
    }
    @action remove() {
        if (!this.size) return undefined;
        const last = this.heap.length - 1;
        this.swap(0, last)
        const val = this.heap.pop()
        this.map[val.id].delete(val.key);
        if (!this.map[val.id].size) {
            delete this.map[val.id]
        }
        this._siftDown(0, last - 1)
        return val
    }

    @action clear() {
        this.heap = []
        return this;
    }
    private getAffinity(parent: string, child: string): number {
        const parentType = this.types[parent]
        const childType = this.types[child]
        if (parentType === childType) {
            if (this.baseTypes.hashTypes.has(parentType)) {
                return 0
            }
            if (this.baseTypes.arrayTypes.has(parentType)) {
                return 2
            }
            return 4
        }
        if (this.baseTypes.arrayTypes.has(parentType) && this.baseTypes.arrayTypes.has(childType)) {
            return 2
        }

        if (!this.baseTypes.unconfigurables.has(parentType) && !!this.baseTypes.unconfigurables.has(childType)) {
            return 3
        }
        if (this.baseTypes.arrayTypes.has(childType)) {
            if (this.baseTypes.hashTypes.has(parentType)) {
                return 1
            }
            return 3
        }
        if (this.baseTypes.arrayTypes.has(parentType)) {
            if (this.parents[parent]) {
                const grandParent = this.parents[parent]
                const grandParentType = this.types[grandParent];
                if (!this.baseTypes.unconfigurables.has(grandParentType)) {
                    return 3
                }
            }
        }
        if (this.baseTypes.hashTypes.has(childType)) {
            if (!this.baseTypes.unconfigurables.has(parentType)) {
                return 3
            }
            return 0
        }

        if (this.baseTypes.hashTypes.has(parentType) && !this.baseTypes.setTypes.has(parentType)) {
            if (this.parents[parent]) return 2
        }

        return 0
    }

}



export default PointerQueue