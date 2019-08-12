import Node from './node';
import { Runner } from ".";
export default function instantiateQueue(runner: Runner) {
    return class Queue {
        private front: Node
        private end: Node
        length: number = 0
        constructor(values?: any[]) {
            this.front = null
            this.end = null
            if (values && typeof values[Symbol.iterator] === 'function') {
                runner.ignore(true)
                const _vals = [...values]
                runner.ignore(false)
                this.push(..._vals)
            }

        }
        push(...values: any[]): number {
            if (!values.length) return this.length
            let current = this.end
            if (!current) {
                this.front = (new Node(values.shift()));
                this.end = this.front;
                current = this.end;
                this.length++
            }
            for (const v of values) {
                current.next = new Node(v, current)
                current.next.prev = current
                current = current.next
                this.length++
            }
            this.end = current
            return this.length
        }

        shift() {
            if (!this.front) return;
            const first = this.front
            this.front = first.next
            first.next = null;
            this.length--;
            if (!this.length) {
                this.end = null
            } else {
                this.front.prev = null
            }
            return first.value
        }
        unshift(...values: any[]): number {
            if (!values.length) return this.length
            let current = this.front
            if (!current) {
                this.front = (new Node(values.pop()))
                this.end = this.front;
                current = this.front;
                this.length++
            }
            values.reverse()
            for (const v of values) {
                current.prev = new Node(v)
                const prev = current;
                current = current.prev
                current.next = prev
                this.front = current
                this.length++
            }
            this.front = current

            return this.length
        }
        pop() {
            if (!this.front) return;
            const last = this.end
            this.end = last.prev
            last.prev = null
            this.length--;
            if (!this.length) {
                this.front = null
            } else {
                this.end.next = null
            }
            return last.value
        }
        * values(): IterableIterator<any> {
            let current = this.front
            while (current) {
                yield current.value;
                current = current.next
            }
        }
    }
}