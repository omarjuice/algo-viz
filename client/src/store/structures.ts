import { observable, action, computed } from "mobx";
import { RootStore } from ".";


class Structures {
    @observable objects: { [id: string]: Viz.Structure } = {}
    @observable gets: { [id: string]: Viz.StructProp } = {}
    @observable sets: { [id: string]: Viz.StructProp } = {}
    @observable pointers: Map<string, Viz.pointer[]> = new Map()
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
            this.pointers.set(id, [])
        }
    }
    @computed get active(): Set<string> {
        const activeIds = this.root.state.activeIds
        const ids: Set<string> = new Set()
        for (let box of activeIds) {
            for (let id of box) {
                const { value } = id
                if (value in this.objects) {
                    const pointers = this.pointers.get(value)
                    if (!pointers || !pointers.length) ids.add(id.value)
                }
            }
        }
        // const step = this.root.iterator.step
        // if (step && typeof step.value == 'string') {
        //     if (step.value in this.objects && !this.children.get(step.value)) {
        //         ids.add(step.value)
        //     }
        //     if (step.type === 'GET' || step.type === 'SET' || step.type === 'CLEAR' || step.type === 'DELETE' || step.type === 'METHODCALL') {
        //         if (step.object in this.objects && !this.children.get(step.object)) ids.add(step.object)
        //     }
        // }
        // console.log(ids.entries())
        return ids
    }
    @computed get updateSpeed() {
        return 4.5 * this.root.iterator.baseTime / this.root.iterator.speed
    }
    @action next(step: Viz.Step.Any) {
        const { allowRender } = this.root
        if (step.type === 'SET') {
            const { object, access, value } = step
            if (access[0] in this.objects[object]) {
                step.prev = this.objects[object][access[0]].value
                if (step.prev in this.objects) {
                    const pointers = this.pointers.get(step.prev)
                    if (pointers) {
                        const newPointers = pointers.filter(p => p.parent === object && p.ref === access[0])
                        this.pointers.set(step.prev, newPointers)
                    }
                }
            }
            if (this.sets[object]) {
                const prop = this.sets[object]
                this.switchOff(prop, 'get', object)
                this.switchOff(prop, 'set', object)
            }
            if (!(access[0] in this.objects[object])) {
                this.objects[object][access[0]] = {
                    get: false,
                    set: true,
                    value
                }
                this.sets[object] = this.objects[object][access[0]]
            } else {
                if (allowRender) {
                    if (this.sets[object] === this.objects[object][access[0]]) {
                        this.sets[object].set = false
                    }
                    this.objects[object][access[0]].set = true
                    this.switchOff(this.objects[object][access[0]], 'get', object)
                }
                this.sets[object] = this.objects[object][access[0]]
                this.objects[object][access[0]].value = value
            }
            if (value in this.objects) {
                const pointers = this.pointers.get(value)
                if (pointers) {
                    pointers.push({
                        parent: object,
                        ref: access[0]
                    })
                }
            }
            const element = document.querySelector(`.set.${object}`)
            if (element) element.scrollIntoView()
        }
        if (step.type === 'DELETE') {
            const { object, access, value } = step
            if (value) {
                const original = this.objects[object][access[0]].value
                step.prev = original

                if (this.root.viz.types[object] !== 'Array') {
                    delete this.objects[object][access[0]]
                }
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
                this.switchOff(prop, 'get', object)
                this.switchOff(prop, 'set', object)
            }
            if (allowRender) {
                if (allowRender) {
                    if (this.gets[object] === this.objects[object][access[0]]) {
                        this.gets[object].get = false
                    }
                    this.objects[object][access[0]].get = true
                    this.switchOff(this.objects[object][access[0]], 'set', object)
                }
            }
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
    @action async reset() {
        const promises = []
        for (let key in this.gets) {
            promises.push(
                this.switchOff(this.gets[key], 'get', key),
                this.switchOff(this.gets[key], 'set', key)
            )
        }
        for (let key in this.sets) {
            promises.push(
                this.switchOff(this.sets[key], 'get', key),
                this.switchOff(this.sets[key], 'set', key)
            )
        }
        await Promise.all(promises)
        // this.gets = {}
        // this.sets = {}
    }
    @action async switchOff(prop: Viz.StructProp, key: 'get' | 'set', object: string) {
        if (prop[key] instanceof Promise) {
            await prop[key].then(() => {
                const ref: 'gets' | 'sets' = (key + 's') as 'gets' | 'sets'
                if (this[ref][object] === prop) {
                    // if (this.root.iterator.iterating) return
                };
                prop[key] = false
            })
        } else {
            prop[key] = false
        }
    }
    @action newChildren() {
        this.pointers = new Map()
    }
}


export default Structures