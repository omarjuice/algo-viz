class DLL {
    next: DLL | null = null
    prev: DLL | null = null
    value: any
    constructor(val: any, prev?: DLL) {
        this.value = val
        this.prev = prev || null
    }
    static create(elems: any[]): DLL {
        if (!Array.isArray(elems)) throw new Error('DLL elements must be given in array form')
        if (!elems.length) throw new Error('Elements must have a length of at least 1')
        const list = new DLL(elems[0])
        let current = list
        for (let i = 1; i < elems.length; i++) {
            current = current.next = new DLL(elems[i], current)
        }
        return list
    }
    static toArray(list: DLL): any[] {
        this.assert(list)
        const elems = []
        const seen: Set<DLL> = new Set()
        let current = list
        while (current) {
            if (seen.has(current)) throw new Error('Cannot convert cyclic lists to array')
            elems.push(current.value)
            seen.add(current)
            current = current.next
        }
        return elems
    }
    private static assert(list: DLL) {
        if (!('next' in list) || !('value' in list) || !('prev' in list)) throw new Error('List must have properties "next" and "value"');
    }
}
export default DLL