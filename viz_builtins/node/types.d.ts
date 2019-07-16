declare namespace Main {
    type Array = {
        sortedInts: (length: number) => number[]
    }
    interface SinglyLinkedList {
        next: null | SinglyLinkedList
        value: any
    }
    interface DoublyLinkedList {
        next: null | DoublyLinkedList
        prev: null | DoublyLinkedList
        value: any
    }
}

