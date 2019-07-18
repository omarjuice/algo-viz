class MinHeap {
    left: MinHeap | null
    right: MinHeap | null
    value: any
    constructor(val: any) {
        this.left = this.right = null
        this.value = val
    }
}