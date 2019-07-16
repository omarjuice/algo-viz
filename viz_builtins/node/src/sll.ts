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
            current = current.next = new SLL(elems[i])
        }
        return list
    }
    static reverse(list: SLL) {
        this.assert(list)
        let current: SLL | null = list
        let prev = null
        const seen: Set<SLL> = new Set()
        while (current) {
            if (seen.has(current)) throw new Error('Cannot reverse cyclic list')
            const next: SLL | null = current.next
            current.next = prev
            prev = current
            seen.add(current)
            current = next
        }
        return prev
    }
    static toArray(list: SLL) {
        this.assert(list)
        const elems: any[] = []
        const seen: Set<SLL> = new Set()
        for (let current: SLL | null = list; !!current; current = current.next) {
            if (seen.has(current)) throw new Error('Cannot convert a cyclic list to array')
            elems.push(current.value)
            seen.add(current)
        }
        return elems
    }
    private static assert(list: SLL) {
        if (!('next' in list) || !('value' in list)) throw new Error('List must have properties "next" and "value"');
    }

}
export default SLL