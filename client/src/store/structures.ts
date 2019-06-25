import { observable, action, computed } from "mobx";
import { RootStore } from ".";

type highlight = {
    object: string
    prop: string | number
}

class Structures {
    @observable objects: { [id: string]: Viz.Structure } = {}
    @observable highlights: { [id: string]: Viz.StructProp } = {}
    @observable flashes: { [id: string]: Viz.StructProp } = {}
    root: RootStore
    constructor(store: RootStore) {
        this.root = store
        const objs = store.viz.objects
        for (const id in objs) {
            const obj: { [key: string]: any } = objs[id]
            const cloned: Viz.Structure = {}
            for (const key in obj) {
                const val = obj[key]
                cloned[key] = {
                    highlight: false,
                    flash: false,
                    value: val
                }
            }
            this.objects[id] = cloned
        }
    }
    @computed get active(): string[] {
        const activeIds = this.root.state.activeIds
        const ids = []
        for (let box of activeIds) {
            for (let id of box) {
                const { value } = id
                if (value in this.objects) {
                    ids.push(id.value)
                }
            }
        }
        return ids
    }
    @action next(step: Viz.Step.Any) {
        if (step.type === 'SET') {
            const { object, access, value } = step
            if (access[0] in this.objects[object]) {
                step.prev = this.objects[object][access[0]].value
            }
            if (this.flashes[object]) {
                this.flashes[object].flash = false
            }
            this.flashes[object] = this.objects[object][access[0]] = {
                highlight: false,
                flash: true,
                value
            }

            const element = document.querySelector(`.flash.${object}`)
            if (element) element.scrollIntoView()
        }
        if (step.type === 'DELETE') {
            const { object, access, value } = step
            if (value) {
                const original = this.objects[object][access[0]].value
                step.prev = original
                delete this.objects[object][access[0]]
            }
        }
        if (step.type === 'CLEAR') {
            const { object } = step
            step.prev = this.objects[object]
            this.objects[object] = {}
        }
        if (step.type === 'GET') {
            const { object, access } = step
            if (this.highlights[object]) {
                this.highlights[object].highlight = false
            }
            this.objects[object][access[0]].highlight = true
            this.highlights[object] = this.objects[object][access[0]]
            const element = document.querySelector(`.highlight.${object}`)
            if (element) element.scrollIntoView()
        }

    }
    @action prev(step: Viz.Step.Any) {
        if (step.type === 'SET') {
            const { object, access } = step
            if ('prev' in step) {
                this.objects[object][access[0]] = {
                    highlight: false,
                    flash: false,
                    value: step.prev
                }
            } else {
                delete this.objects[object][access[0]]
            }
        }
        if (step.type === 'DELETE') {
            const { object, access, value } = step
            if (value) {
                this.objects[object][access[0]] = {
                    highlight: false,
                    flash: true,
                    value: step.prev
                }
            }
        }
        if (step.type === 'CLEAR') {
            const { object } = step
            this.objects[object] = step.prev
        }
        if (step.type === 'GET') {
            const { object, access, value } = step;
            this.objects[object][access[0]] = {
                highlight: false,
                flash: false,
                value
            }
        }

    }
    @action reset() {
        for (let key in this.highlights) {
            this.highlights[key].highlight = false
        }
        for (let key in this.flashes) {
            this.flashes[key].flash = false
        }
        this.highlights = {}
        this.flashes = {}
    }
}


export default Structures