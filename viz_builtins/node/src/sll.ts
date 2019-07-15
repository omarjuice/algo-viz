class SLL implements Main.SinglyLinkedList {
    next: SLL | null
    value: any
    constructor(val: any) {
        this.value = val
        this.next = null
    }
    static create(elems: any[]): SLL {
        if (!Array.isArray(elems)) throw new Error('SLL elements must be given in array form')
        if (!elems.length) throw new Error('Elements must have a length of at least 1')
        const list = new SLL(elems[0])
        let current = list
        for (let i = 1; i < elems.length; i++) {
            current.next = new SLL(elems[i])
            current = current.next
        }
        return list
    }
    static reverse(list: SLL) {
        this.assert(list)
        let current: SLL | null = list
        let prev = null
        while (current) {
            const next: SLL | null = current.next
            current.next = prev
            prev = current
            current = next
        }
        return prev
    }
    static toArray(list: SLL) {
        this.assert(list)
        const elems: any[] = []
        for (let current: SLL | null = list; !!current; current = current.next) {
            elems.push(current.value)
        }
        return elems
    }
    private static assert(list: SLL) {
        if (!('next' in list) || !('value' in list)) throw new Error('List must have properties "next" and "value"');
    }

}
export default SLL