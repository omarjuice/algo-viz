import { observable, action } from "mobx";
import { RootStore } from ".";


class Structures {
    @observable objects: { [id: string]: Viz.Structure } = {}
    @observable gets: { [id: string]: Viz.StructProp } = {}
    @observable sets: { [id: string]: Viz.StructProp } = {}
    @observable pointers: Map<string, Viz.pointers> = new Map()
    @observable bindings: Set<string> = new Set()
    @observable children: { [key: string]: Map<string, [number]> } = {}
    @observable activePointers: { [id: string]: boolean } = {}
    // @observable children: Map<string, string> = new Map()
    root: RootStore
    constructor(store: RootStore) {
        this.root = store
        const objs = store.viz.objects
        for (const id in objs) {
            if (!this.pointers.has(id)) this.pointers.set(id, new Map())
            if (!this.children[id]) this.children[id] = new Map()
            const obj: { [key: string]: any } = objs[id]
            const cloned: Viz.Structure = {}
            const type = this.root.viz.types[id]
            if (type === 'Array') {
                for (let i = 0; i < obj['length']; i++) {
                    const val = obj[i]
                    cloned[i] = {
                        get: false,
                        set: false,
                        value: val
                    }
                    if (val in objs) {
                        this.addPointers(val, id, i)
                    }
                }
                cloned['length'] = {
                    get: false,
                    set: false,
                    value: obj['length']
                }
            } else {
                for (const key in obj) {
                    const val = obj[key]
                    cloned[key] = {
                        get: false,
                        set: false,
                        value: val
                    }
                    if (val in objs) {
                        this.addPointers(val, id, key)
                    }
                }
            }

            this.objects[id] = cloned
            this.activePointers[id] = false
        }
    }
    @action setBindings() {
        const activeIds = this.root.state.activeIds
        const ids: Set<string> = new Set()
        for (const box of activeIds) {
            for (const id of box) {
                const { value } = id
                if (value in this.objects) {
                    ids.add(value)
                }
            }
        }
        const adds: string[] = []
        const deletes: string[] = []
        ids.forEach(id => {
            const parents = this.pointers.get(id)
            if (parents) {
                const firstParent = parents.entries().next().value
                if (firstParent) {
                    if (ids.has(firstParent[0])) {
                        adds.push(firstParent[0])
                        deletes.push(id)
                    }
                }
            }
        })
        for (const id of deletes) {
            ids.delete(id)
        }
        for (const id of adds) {
            ids.add(id)
        }

        this.bindings = ids
    }
    @action addPointers(id: string, parent: string, key: string | number) {
        const childType = this.root.viz.types[id]
        const parentType = this.root.viz.types[parent]
        if (parentType === 'Array' && childType !== 'Array') return
        if (id !== parent) {
            if (!this.pointers.has(id)) this.pointers.set(id, new Map())
            if (!this.children[id]) this.children[id] = new Map()
            const parents = this.pointers.get(id)
            if (parents) {
                let refs = parents.get(parent)
                if (refs) {
                    refs.push(key)
                } else {
                    parents.set(parent, [key])
                }
            }
            const firstParent = parents.entries().next().value
            if (firstParent[0] === parent) {
                if (!this.children[parent].has(id)) {
                    this.children[parent].set(id, [1])
                } else {
                    this.children[parent].get(id)[0]++
                }
            }
        }

    }
    @action removePointers(id: string, parent: string, ref: string | number) {
        const parents = this.pointers.get(id)
        if (parents) {
            const refs = parents.get(parent)
            if (refs) {
                for (let i = 0; i < refs.length; i++) {
                    if (refs[i] === ref) {
                        refs.splice(i, 1)
                    }
                }
                if (!refs.length) {
                    parents.delete(parent)
                    this.children[parent].delete(id)
                    const firstParent = parents.entries().next().value
                    if (firstParent) {
                        const parentId = firstParent[0]
                        if (!this.children[parentId].has(id)) {
                            this.children[parentId].set(id, [1])
                        } else {
                            this.children[parentId].get(id)[0]++
                        }
                    }
                } else {
                    this.children[parent].get(id)[0]--
                }
            }
        }
    }

    @action next(step: Viz.Step.Any) {
        const { allowRender } = this.root
        if (step.type === 'SET') {
            const { object, access, value } = step
            if (access[0] in this.objects[object]) {
                step.prev = this.objects[object][access[0]].value
                if (step.prev in this.objects) {
                    this.removePointers(step.prev, object, access[0])
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
                this.addPointers(value, object, access[0])
            }
            if (allowRender && access[0] === 'length' && this.root.viz.types[object] === 'Array' && step.prev !== value) {
                this.children[object].clear()
                const obj = this.objects[object]
                const moddedRefs: Set<Array<string | number>> = new Set()
                for (let i = 0; i < value; i++) {
                    if (i in obj) {
                        const info = obj[i]
                        const { value } = info
                        if (typeof value === 'string' && value in this.objects) {
                            const parents = this.pointers.get(value)
                            const parent = parents.get(object)
                            if (parent) {
                                if (!moddedRefs.has(parent)) {
                                    parent.splice(0, parent.length)
                                    moddedRefs.add(parent)
                                }
                                parent.push(i)
                            }
                            const firstParent = parents.entries().next().value
                            if (firstParent) {
                                const parentId = firstParent[0]
                                if (!this.children[parentId].has(value)) {
                                    this.children[parentId].set(value, [1])
                                } else {
                                    this.children[parentId].get(value)[0]++
                                }
                            }


                        }
                    }
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
                if (step.prev in this.objects) {
                    this.removePointers(step.prev, object, access[0])
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
        if (allowRender) this.setBindings()
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
        for (const key in this.gets) {
            promises.push(
                this.switchOff(this.gets[key], 'get', key),
                this.switchOff(this.gets[key], 'set', key)
            )
        }
        for (const key in this.sets) {
            promises.push(
                this.switchOff(this.sets[key], 'get', key),
                this.switchOff(this.sets[key], 'set', key)
            )
        }
        this.pointers = new Map()
        this.children = {}
        for (const id in this.objects) {
            if (!this.pointers.has(id)) this.pointers.set(id, new Map())
            if (!this.children[id]) this.children[id] = new Map()
            const type = this.root.viz.types[id]
            const obj = this.objects[id]
            if (type === 'Array') {
                for (let i = 0; i < obj['length'].value; i++) {
                    if (i in obj) {
                        const val = obj[i].value
                        if (val in this.objects) {
                            this.addPointers(val, id, i)
                        }
                    }
                }
            } else {
                for (const key in obj) {
                    const val = obj[key].value
                    if (val in this.objects) {
                        this.addPointers(val, id, key)
                    }
                }
            }
            this.activePointers[id] = false
        }
        await Promise.all(promises)

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

}


export default Structures