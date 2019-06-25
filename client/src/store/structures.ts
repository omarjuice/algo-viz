import { observable, action, computed } from "mobx";
import { RootStore } from ".";

type highlight = {
    object: string
    prop: string | number
}

class Structures {
    @observable objects: { [id: string]: Viz.Structure } = {}
    @observable highlight: highlight | null
    @observable flash: highlight | null
    root: RootStore
    constructor(store: RootStore) {
        this.root = store
        const objs = store.viz.objects
        for (const id in objs) {
            const obj: { [key: string]: any } = objs[id]
            const cloned: Viz.Structure = {}
            for (const key in obj) {
                const val = obj[key]
                cloned[key] = val
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
                step.prev = this.objects[object][access[0]]
            }
            this.objects[object][access[0]] = value
            this.flash = { object, prop: access[0] }
        }
        if (step.type === 'DELETE') {
            const { object, access, value } = step
            if (value) {
                const original = this.objects[object][access[0]]
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
            this.highlight = { object, prop: access[0] }
        }

    }
    @action prev(step: Viz.Step.Any) {
        if (step.type === 'SET') {
            const { object, access } = step
            if ('prev' in step) {
                this.objects[object][access[0]] = step.prev
            } else {
                delete this.objects[object][access[0]]
            }
        }
        if (step.type === 'DELETE') {
            const { object, access, value } = step
            if (value) {
                this.objects[object][access[0]] = step.prev
            }
        }
        if (step.type === 'CLEAR') {
            const { object } = step
            this.objects[object] = step.prev
        }

    }
}


export default Structures