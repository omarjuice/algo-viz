
export default class Node {
    value: any
    next: Node
    prev: Node
    constructor(v: any, prev: Node = null) {
        this.value = v
        this.next = null
        this.prev = prev

    }
}
