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
        const elems: any[] = []
        this.forEach(list, val => elems.push(val))
        return elems
    }
    static forEach(list: DLL, callback: (val: any) => any): void {
        this.assert(list)
        const seen: Set<DLL> = new Set()
        for (let current: DLL | null = list; !!current; current = current.next) {
            if (seen.has(current)) throw new Error('Cannot convert a cyclic list to array')
            callback(current.value)
            seen.add(current)
        }
    }
    private static assert(list: DLL) {
        if (!('next' in list) || !('value' in list) || !('prev' in list)) throw new Error('List must have properties "next" and "value"');
    }
    static reverse(list: DLL) {
        const seen: Set<DLL> = new Set()
        let current = list
        let prev = null
        while (current) {
            if (seen.has(current)) {
                throw new Error('Cannot reverse cyclic lists')
            }
            const next: DLL | null = current.next
            current.next = prev
            prev = current
            seen.add(current)
            current = next
            if (prev) {
                prev.prev = current
            }
        }
        return prev

    }
}
export default DLL
