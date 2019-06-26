import { observable, action, computed } from "mobx";
import { RootStore } from ".";

type get = {
    object: string
    prop: string | number
}

class Structures {
    @observable objects: { [id: string]: Viz.Structure } = {}
    @observable gets: { [id: string]: Viz.StructProp } = {}
    @observable sets: { [id: string]: Viz.StructProp } = {}
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
                    get: false,
                    set: false,
                    value: val
                }
            }
            this.objects[id] = cloned
        }
    }
    @computed get active(): Set<string> {
        const activeIds = this.root.state.activeIds
        const ids: Set<string> = new Set()
        for (let box of activeIds) {
            for (let id of box) {
                const { value } = id
                if (value in this.objects) {
                    ids.add(id.value)
                }
            }
        }
        const step = this.root.iterator.step
        if (step && typeof step.value == 'string') {
            if (step.value in this.objects) {
                ids.add(step.value)
            }
            if (step.type === 'GET' || step.type === 'SET' || step.type === 'CLEAR' || step.type === 'DELETE' || step.type === 'METHODCALL') {
                if (step.object in this.objects) ids.add(step.object)
            }
        }

        return ids
    }
    @computed get updateSpeed() {
        return 5 * this.root.iterator.baseTime / this.root.iterator.speed
    }
    @action next(step: Viz.Step.Any) {
        if (step.type === 'SET') {
            const { object, access, value } = step
            if (access[0] in this.objects[object]) {
                step.prev = this.objects[object][access[0]].value
            }
            if (this.sets[object]) {

                const prop = this.sets[object]
                setTimeout(() => {
                    prop.set = false
                    prop.get = false
                }, this.updateSpeed)
            }
            if (!(access[0] in this.objects[object])) {
                this.objects[object][access[0]] = {
                    get: false,
                    set: true,
                    value
                }
                this.sets[object] = this.objects[object][access[0]]
            } else {
                this.objects[object][access[0]].set = true
                this.objects[object][access[0]].value = value
                this.sets[object] = this.objects[object][access[0]]
            }

            const element = document.querySelector(`.set.${object}`)
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
            if (this.gets[object]) {
                const prop = this.gets[object]
                setTimeout(() => {
                    prop.set = false
                    prop.get = false
                }, this.updateSpeed)
            }
            this.objects[object][access[0]].get = true
            this.gets[object] = this.objects[object][access[0]]
            const element = document.querySelector(`.get.${object}`)
            if (element) element.scrollIntoView()
        }

    }
    @action prev(step: Viz.Step.Any) {
        if (step.type === 'SET') {
            const { object, access } = step
            if ('prev' in step) {
                this.objects[object][access[0]] = {
                    get: false,
                    set: false,
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
                    get: false,
                    set: true,
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
                get: false,
                set: false,
                value
            }
        }

    }
    @action reset() {
        for (let key in this.gets) {
            this.gets[key].get = false
        }
        for (let key in this.sets) {
            this.sets[key].set = false
        }
        this.gets = {}
        this.sets = {}
    }
}


export default Structures