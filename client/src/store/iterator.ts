import { observable, action } from "mobx";
import { RootStore } from ".";

type handler = {
    value: number
    allow: boolean

}

class IteratorStore {
    @observable index: number = -1
    @observable step: Viz.Step.Any
    @observable name: void | Viz.name
    @observable iterating: boolean = false
    @observable direction: boolean = true
    @observable speed: number = 1
    @observable handling: boolean = false
    @observable handler: handler = { value: 0, allow: true }
    timer: any = null
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
            clearTimeout(this.timer)
        } else if (nextIdx >= this.root.viz.steps.length) {
            clearTimeout(this.timer)
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
        if (this.root.editing) {
            this.iterating = false;
            if (this.timer) {
                clearTimeout(this.timer)
            }
            return
        }
        if (this.step) {
            const { type } = this.step
            let nextTime = 100
            if (['EXPRESSION', 'CALL', 'DECLARATION', 'ASSIGNMENT', 'RETURN'].includes(type)) {
                nextTime *= 7.5
            }
            const exec = () => {
                const cont = this.next()
                if (cont) {
                    this.begin()
                }
            }
            this.timer = setTimeout(exec, nextTime / this.speed)
        } else {
            this.next()
            this.begin()
        }
    }
    @action play() {
        this.iterating = true
        if (this.index < 0 || this.index >= this.root.viz.steps.length) {
            this.index = -1
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

    @action beforeChange() {
        if (this.handler.allow) {
            clearTimeout(this.timer)
            this.handling = true
            this.pause()
            this.handler.value = this.index
        }

    }
    @action change(val: number) {
        if (this.handler.allow && this.handling) {
            this.handler.value = val
        }
    }
    @action afterChange() {
        if (this.handler.allow && this.handling) {
            this.handling = false
            this.handler.allow = false
            if (this.handler.value > this.index) {
                this.direction = true
            } else {
                this.index++
                this.direction = false
            }
            this.root.allowRender = false
            while (this.index !== this.handler.value) {
                this.iterating = true
                this.next()
            }
            let type = null
            try {
                type = this.root.viz.steps[this.index].type
            } catch (e) { }
            if (!this.direction && (type === 'FUNC' || type === 'METHOD' || type === 'RETURN')) {
                this.next()
            }
            this.root.allowRender = true
            this.iterating = false
            this.direction = true
            setTimeout(() => {
                this.handler.allow = true
            }, 500)
            this.play()
        }
    }
}
export default IteratorStore