import { observable, action } from "mobx";
import { RootStore } from ".";

type handler = {
    value: number
    allow: boolean
    changing: boolean
    wasPlaying: boolean

}

class IteratorStore {
    @observable index: number = -1
    @observable step: Viz.Step.Any
    @observable name: void | Viz.name
    @observable iterating: boolean = false
    @observable direction: boolean = true
    @observable speed: number = 1
    @observable handling: boolean = false
    @observable handler: handler = { value: 0, allow: true, changing: false, wasPlaying: false }
    onKeyUp: (e: any) => void
    keyPressCooldown: boolean = false
    baseTime: number = 100
    timer: any = null
    maxSpeed: number = 32
    minSpeed: number = 1 / 4
    root: RootStore
    constructor(store: RootStore) {
        this.root = store
        this.onKeyUp = (e) => {
            if (!this.root.allowRender || this.keyPressCooldown || this.root.editor.active) {
                return
            }

            if (e.which === 32) {
                if (this.iterating) {
                    this.pause()
                } else {
                    this.play()
                }
            }
            if (e.which === 37) {
                if (this.iterating) {
                    this.slower()
                } else {
                    if (store.iterator.index <= 0) return;
                    this.exec(false)
                }
            }
            if (e.which === 39) {
                if (this.iterating) {
                    this.faster()
                } else {
                    if (store.iterator.index >= store.viz.steps.length - 1) return;
                    this.exec(true)
                }
            }
            this.keyPressCooldown = true
            setTimeout(() => {
                this.keyPressCooldown = false
            }, 50)
        }

        document.addEventListener('keydown', this.onKeyUp)

    }
    cleanUp() {
        document.removeEventListener('keydown', this.onKeyUp)
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
            const nextIdx = this.index
            const nextType = (this.root.viz.steps[nextIdx] || { type: 'EXPRESSION' }).type
            let nextTime = this.baseTime
            nextTime *= this.root.settings.speeds[nextType as Viz.configurable] || 0
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
        this.direction = true;
        if (this.index >= this.root.viz.steps.length - 1) {
            clearTimeout(this.timer)
            this.handler.allow = true
            this.handler.value = 0
            this.handling = true
            this.handler.wasPlaying = true
            return this.afterChange()
        }
        this.begin()
    }
    @action async pause() {
        this.iterating = false
        await this.root.structs.reset()
    }
    @action faster() {
        this.speed *= 2
        if (this.speed > this.maxSpeed) {
            this.speed = this.maxSpeed
        }
    }
    @action exec(bool: boolean) {
        const newIdx = bool ? this.index + 1 : this.index - 1
        if (newIdx < this.index) this.index++;
        this.direction = bool;
        while (this.index !== newIdx) {
            this.iterating = true
            this.next()
        }
        this.direction = true
        if (!bool) {
            this.index--
            this.next()
        }
        this.iterating = false


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
            this.handler.wasPlaying = this.iterating
            this.pause()
            this.handler.value = this.index
        }

    }
    @action change(val: number) {
        if (this.handler.allow && this.handling) {
            this.handler.changing = true
            this.handler.value = val
        }
    }
    @action async afterChange() {
        if (this.handler.allow && this.handling) {
            // const t1 = Date.now()
            const iterating = this.handler.wasPlaying
            this.handling = false
            this.handler.allow = false
            if (this.handler.value > this.index) {
                this.direction = true
            } else {
                this.index++
                this.direction = false
            }
            this.root.allowRender = !iterating
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
            this.iterating = false
            this.handler.changing = false
            setTimeout(() => {
                this.handler.allow = true
            }, 500)
            //remove highlights and flashes
            await this.root.structs.reset()
            this.root.structs.resetPositions()
            this.root.allowRender = true
            if (iterating) this.play()
            // console.log('SKIP PERFORMANCE: ', Date.now() - t1)
        }
    }
    @action reset() {
        console.log('RESET');
        this.beforeChange();
        this.change(this.index)
        this.afterChange()
    }
    getSpeed(type: Viz.configurable) {
        if (!this.iterating) {
            return 300
        }
        return this.baseTime * this.root.settings.speeds[type] / this.speed
    }
}
export default IteratorStore