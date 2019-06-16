import { observable, action } from "mobx";
import { RootStore } from ".";


class IteratorStore {
    @observable index: number = -1
    @observable step: any
    @observable name: void | Viz.name
    @observable iterating: boolean = false
    @observable direction: boolean = true
    @observable speed: number = 1
    maxSpeed: number = 64
    minSpeed: number = 1 / 4
    root: RootStore
    constructor(store: RootStore) {
        this.root = store
    }
    @action next() {
        if (!this.iterating) return false;
        let nextIdx = this.direction ? ++this.index : --this.index
        if (nextIdx < 0) {
            nextIdx = 0
            this.iterating = false
        } else if (nextIdx >= this.root.viz.steps.length) {
            nextIdx = this.root.viz.steps.length - 1
            this.iterating = false
        }
        this.step = this.root.viz.steps[nextIdx]
        this.name = this.step.name
        this.root.code.update()
        this.root.state[this.direction ? 'next' : 'prev'](this.step)
        return true
    }
    @action private begin() {
        if (this.step) {
            const { type } = this.step
            let nextTime = 0
            if (['EXPRESSION', 'CALL', 'DECLARATION', 'ASSIGNMENT', 'RETURN'].includes(type)) {
                nextTime = 750
            } else {
                nextTime = 100
            }
            setTimeout(() => {
                const cont = this.next()
                if (cont) {
                    this.begin()
                }
            }, nextTime / this.speed)
        } else {
            this.next()
            this.begin()
        }
    }
    @action play() {
        this.iterating = true
        if (this.index < -1) {
            this.index = -1
            this.direction = true
        } else if (this.index > this.root.viz.steps.length - 1) {
            this.index = this.root.viz.steps.length - 1
            this.direction = false
        }
        this.begin()
    }
    @action pause() {
        this.iterating = false
    }
    @action faster() {
        this.speed *= 2
        if (this.speed > this.maxSpeed) {
            this.speed = this.maxSpeed
        }
    }
    @action slower() {
        this.speed /= 2
        if (this.speed < this.minSpeed) {
            this.speed = this.minSpeed
        }
    }

}
export default IteratorStore