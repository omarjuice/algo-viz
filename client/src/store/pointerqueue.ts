import { observable, computed, action, toJS } from "mobx";
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
    private _compare(a: Viz.objectPointer, b: Viz.objectPointer, idxs: [number, number]): boolean {
        try {
            if (a.affinity === b.affinity) {
                if (a.index === b.index) {
                    return a.key < b.key
                }
                return a.index < b.index
            }
            return a.affinity > b.affinity
        } catch (e) {
            console.log(toJS(this.heap))
            console.log(idxs)
            throw (e)
        }
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
        if (parentId === this.id) return this
        const affinity = this.getAffinity(parentId, this.id)
        if (parentId in this.map) {
            if (this.map[parentId].has(key)) return this
        }
        if (affinity > 0) {
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