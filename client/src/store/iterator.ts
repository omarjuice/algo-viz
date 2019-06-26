import { observable, action } from "mobx";
import { RootStore } from ".";

type handler = {
    value: number
    allow: boolean
    changing: boolean

}

class IteratorStore {
    @observable index: number = -1
    @observable step: Viz.Step.Any
    @observable name: void | Viz.name
    @observable iterating: boolean = false
    @observable direction: boolean = true
    @observable speed: number = 1
    @observable handling: boolean = false
    @observable handler: handler = { value: 0, allow: true, changing: false }
    baseTime: number = 100
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
            this.pause()
            clearTimeout(this.timer)
        } else if (nextIdx >= this.root.viz.steps.length - 1) {
            clearTimeout(this.timer)
            nextIdx = this.root.viz.steps.length - 1
            this.pause()
        }
        this.step = this.root.viz.steps[nextIdx]
        this.name = this.step.name
        this.root.code.update()
        this.root.state[this.direction ? 'next' : 'prev'](this.step)
        this.root.structs[this.direction ? 'next' : 'prev'](this.step)

        return true
    }
    @action private begin() {
        if (this.root.editor.active) {
            this.iterating = false;
            if (this.timer) {
                clearTimeout(this.timer)
            }
            return
        }
        if (this.step) {
            const { type } = this.step
            let nextTime = this.baseTime
            if (['EXPRESSION', 'CALL', 'DECLARATION', 'ASSIGNMENT', 'RETURN'].includes(type)) {
                nextTime *= 7.5
            }
            if (['GET', 'SET'].includes(type)) {
                nextTime *= 5
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
        if (this.index >= this.root.viz.steps.length - 1) {
            clearTimeout(this.timer)
            this.handler.allow = true
            this.handler.value = 0
            this.handling = true
            return this.afterChange()
        }
        this.begin()
    }
    @action pause() {
        this.iterating = false
        this.root.structs.reset()
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
        if (this.handler.allow && !this.handler.changing) {
            clearTimeout(this.timer)
            this.handling = true
            this.pause()
            this.handler.value = this.index
            console.log('BEFORE')
        }

    }
    @action change(val: number) {
        if (this.handler.allow && this.handling) {
            console.log('CHANGE', val)
            this.handler.changing = true
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

            const dir = this.direction
            this.direction = true
            if (!dir) {
                this.index--
                this.next()
            }
            this.root.allowRender = true
            this.iterating = false
            this.handler.changing = false
            setTimeout(() => {
                this.handler.allow = true

            }, 500)
            //remove highlights and flashes
            this.root.structs.reset()
            this.play()
        }
    }
}
export default IteratorStore