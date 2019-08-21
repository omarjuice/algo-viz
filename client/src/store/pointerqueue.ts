import { observable, computed, action } from "mobx";
type types = { [key: string]: string }
type parents = { [id: string]: string }
class PointerQueue {
    @observable heap: Viz.objectPointer[] = []
    parents: parents
    types: types
    map: { [id: string]: Map<string | number, number> }
    id: string
    constructor(types: types, parents: parents, id: string) {
        this.types = types;
        this.parents = parents;
        this.id = id
        this.map = {}
    }
    private _compare(a: Viz.objectPointer, b: Viz.objectPointer): boolean {
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
        const val1 = this.heap[i]
        const val2 = this.heap[j]
        this.map[val1.id].set(val1.key, i);
        this.map[val2.id].set(val2.key, j);
    }
    @computed get size() {
        return this.heap.length;
    }
    @computed get top() {
        return this.heap.length ? this.heap[0] : null
    }
    @action private _siftUp(idx: number) {
        let parent = Math.floor((idx - 1) / 2)

        while (idx > 0 && this._compare(this.heap[idx], this.heap[parent])) {
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
            if (child2 !== -1 && this._compare(this.heap[child2], this.heap[child1])) {
                swapIdx = child2
            }
            if (this._compare(this.heap[swapIdx], this.heap[idx])) {
                this.swap(idx, swapIdx)
                idx = swapIdx;
                child1 = idx * 2 + 1
            } else {
                return
            }
        }
    }

    @action insert(key: string | number, parentId: string, index: number) {
        if (parentId === this.id) return this
        const affinity = this.getAffinity(parentId, this.id)
        if (affinity > 0) {
            this.heap.push({
                key,
                id: parentId,
                index,
                affinity
            });
            if (!(parentId in this.map)) {
                this.map[parentId] = new Map([[key, this.heap.length - 1]])
            }
            this._siftUp(this.heap.length - 1);
        }
        return this
    }
    @action remove() {
        if (!this.size) return undefined;
        const last = this.heap.length - 1;
        [this.heap[last], this.heap[0]] = [this.heap[0], this.heap[last]];
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
        const hashTypes = ['Object', 'Map', 'Set']
        const parentType = this.types[parent]
        const childType = this.types[child]
        if (parentType === childType) {
            if (parentType === 'Array') {
                return 2
            }
            if (hashTypes.includes(parentType)) {
                return 0
            }
            return 4
        }
        if (!hashTypes.includes(parentType) && !hashTypes.includes(childType) && parentType !== 'Array' && childType !== 'Array') {
            return 3
        }
        if (childType === 'Array') {
            if (hashTypes.includes(parentType)) {
                return 1
            }
            return 3
        }
        if (hashTypes.includes(childType)) {
            if (!hashTypes.includes(parentType) && parentType !== 'Array') {
                return 3
            }
            return 0
        }
        if (parentType === 'Array') {
            if (this.parents[parent]) {
                const firstParent = this.parents[parent]
                const type = this.types[firstParent];
                if (!hashTypes.includes(type)) {
                    return 2
                }
            }
            return 0
        }
        if (['Object', 'Map'].includes(parentType)) {
            if (this.parents[parent]) return 2
        }

        return 0
    }

}






export default PointerQueue