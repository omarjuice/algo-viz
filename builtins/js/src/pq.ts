import { Runner } from ".";
type compareFn = (a: any, b: any) => boolean
type searchFn = (val: any) => boolean
export default function instantiatePQ(runner: Runner) {
    return class PQ {
        private _compare: (a: any, b: any) => boolean
        private display: any = 0;
        private heap: any[]
        constructor(arg1: any[] | compareFn, arg2?: compareFn) {
            let compare: compareFn, items: any[];
            if (typeof arg1 === 'function') {
                compare = arg1
                items = []
            } else if (arg1 && typeof arg1 === 'object' && typeof arg1[Symbol.iterator] === 'function') {
                runner.ignore(true)
                items = [...arg1]
                runner.ignore(false)
                if (typeof arg2 === 'function') {
                    compare = arg2
                }
            }
            if (!compare) {
                compare = (a, b) => a < b
            }
            if (!items) {
                items = []
            }
            this._compare = (a, b) => Boolean(compare(a, b));

            this.display = 0
            this.buildHeap(items)
        }
        get size() {
            return this.heap.length;
        }
        buildHeap(items: any[]) {
            this.heap = items
            const first = Math.floor((items.length - 2) / 2);
            for (let i = first; i >= 0; i--) {
                this._siftDown(i, items.length - 1)
            }
            return this
        }
        private _siftUp(idx: number) {
            let parent = Math.floor((idx - 1) / 2)

            while (idx > 0 && (this.display = this._compare(this.heap[idx], this.heap[parent]))) {
                [this.heap[idx], this.heap[parent]] = [this.heap[parent], this.heap[idx]];
                idx = parent;
                parent = Math.floor((idx - 1) / 2)
            }
        }
        private _siftDown(idx: number, end: number) {
            let child1 = idx * 2 + 1

            while (child1 <= end) {
                const child2 = idx * 2 + 2 <= end ? idx * 2 + 2 : -1;
                let swapIdx = child1
                if (child2 !== -1 && (this.display = this._compare(this.heap[child2], this.heap[child1]))) {
                    swapIdx = child2
                }
                if (this.display = this._compare(this.heap[swapIdx], this.heap[idx])) {
                    [this.heap[swapIdx], this.heap[idx]] = [this.heap[idx], this.heap[swapIdx]];
                    idx = swapIdx;
                    child1 = idx * 2 + 1
                } else {
                    return
                }
            }
        }

        insert(...values: any[]) {
            for (const value of values) {
                this.heap.push(value);
                this._siftUp(this.heap.length - 1);
                this.display = this.size
            }
            return this
        }
        remove() {
            if (!this.heap.length) return undefined;
            const last = this.heap.length - 1;
            [this.heap[last], this.heap[0]] = [this.heap[0], this.heap[last]];
            const val = this.heap.pop()
            this._siftDown(0, last - 1)
            this.display = this.size
            return val
        }
        findAndRemove(search: any | searchFn): any {
            if (typeof search !== 'function') {
                const value = search;
                search = (val: any) => val === value
            }
            for (let i = 0; i < this.heap.length; i++) {
                const val = this.heap[i]
                if (Boolean(search(val))) {
                    if (i === this.heap.length - 1) {
                        return this.heap.pop()
                    }
                    delete this.heap[i];
                    this.heap[i] = this.heap.pop();
                    if (this.size > 1) {
                        const parent = Math.floor((i - 1) / 2);
                        if (this._compare(this.heap[i], this.heap[parent])) {
                            this._siftUp(i);
                        } else {
                            this._siftDown(i, this.heap.length - 1);
                        }
                    }
                    return val
                }
            }
            return undefined
        }
        peek() {
            return this.heap[0]
        }
        clear() {
            this.heap = []
            return this;
        }
        * values(): IterableIterator<any> {
            for (const val of this.heap) {
                yield val;
            }
        }
        toArray() {
            return [...this.heap]
        }

    }


}