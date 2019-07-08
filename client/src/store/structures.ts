import { observable, action, toJS } from "mobx";
import { RootStore } from ".";


class Structures {
    @observable objects: { [id: string]: Viz.Structure } = {}
    @observable gets: { [id: string]: Viz.StructProp } = {}
    @observable sets: { [id: string]: Viz.StructProp } = {}
    @observable pointers: Map<string, Viz.pointers> = new Map()
    @observable bindings: Set<string> = new Set()
    @observable children: { [key: string]: Set<string> } = {}
    @observable parents: { [key: string]: Set<string> } = {}
    @observable activePointers: { [id: string]: boolean } = {}
    // @observable children: Map<string, string> = new Map()
    root: RootStore
    constructor(store: RootStore) {
        this.root = store
        const objs = store.viz.objects
        for (const id in objs) {
            if (!this.pointers.has(id)) this.pointers.set(id, new Map())
            if (!this.children[id]) this.children[id] = new Set()
            if (!this.parents[id]) this.parents[id] = new Set()
            const obj: { [key: string]: any } = objs[id]
            const cloned: Viz.Structure = {}
            const type = this.root.viz.types[id]
            if (!type) return
            if (!this.root.settings.structColors[type] || !this.root.settings.structSettings[type]) {
                this.root.settings.addStruct(type)
            }

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
        const deletes: string[] = []
        const list: string[] = []

        ids.forEach(id => {
            const parents = this.parents[id]
            if (parents.size) {
                parents.forEach(parentId => {
                    ids.add(parentId)
                })
                list.push(this.root.viz.types[id])
                deletes.push(id)
            }
        })
        deletes.forEach(id => {
            ids.delete(id)
        })

        this.bindings = ids
    }
    @action addPointers(id: string, parent: string, key: string | number) {
        if (id !== parent) {
            if (!this.pointers.has(id)) this.pointers.set(id, new Map())
            if (!this.children[id]) this.children[id] = new Set()
            if (!this.parents[id]) this.parents[id] = new Set()
            const parents = this.pointers.get(id)
            if (parents) {
                let refs = parents.get(parent)
                if (refs) {
                    console.log(toJS(refs))
                    refs.push(key)
                } else {
                    parents.set(parent, [key])
                }
            }
            const currentParents = this.parents[id]
            const affinity = this.getAffinity(parent, id)
            if (affinity > 0) {
                if (affinity === 4) {
                    const deletes: string[] = []
                    currentParents.forEach(objectId => {
                        if (this.getAffinity(objectId, id) < 4) {
                            deletes.push(objectId)
                        }
                    })
                    deletes.forEach(objectId => {
                        currentParents.delete(objectId)
                        this.children[objectId].delete(id)
                    })
                    currentParents.add(parent)
                    this.children[parent].add(id)
                } else {
                    if (!currentParents.size) {
                        currentParents.add(parent)
                        this.children[parent].add(id)
                    } else {
                        const entries = currentParents.entries()
                        const first = entries.next().value
                        if (affinity > this.getAffinity(first[0], id)) {
                            currentParents.delete(first[0])
                            currentParents.add(parent)
                            this.children[first[0]].delete(id)
                            this.children[parent].add(id)
                        }
                    }
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
                    this.parents[id].delete(parent)
                    if (!this.parents[id].size) {
                        let bestParent: { objectId: string, affinity: number } = { objectId: '', affinity: 0 }
                        parents.forEach((_, objectId) => {
                            const affinity = this.getAffinity(objectId, id)
                            if (affinity > bestParent.affinity) {
                                bestParent = {
                                    objectId, affinity
                                }
                            }
                        })
                        if (bestParent.affinity > 0) {
                            this.parents[id].add(bestParent.objectId)
                            this.children[bestParent.objectId].add(id)
                        }
                    }
                }
            }
        }
    }

    @action next(step: Viz.Step.Any) {
        const { allowRender } = this.root
        if (step.type === 'SET') {
            const { object, access, value } = step
            const [key] = access
            if (key in this.objects[object]) {
                step.prev = this.objects[object][key].value
                if (step.prev in this.objects) {
                    this.removePointers(step.prev, object, key)
                }

            }
            if (this.sets[object]) {
                const prop = this.sets[object]
                this.switchOff(prop, 'get', object)
                this.switchOff(prop, 'set', object)
            }
            if (!(key in this.objects[object])) {
                this.objects[object][key] = {
                    get: false,
                    set: true,
                    value
                }
                this.sets[object] = this.objects[object][key]
            } else {
                if (allowRender) {
                    if (this.sets[object] === this.objects[object][key]) {
                        this.sets[object].set = false
                    }
                    this.objects[object][key].set = true
                    this.switchOff(this.objects[object][key], 'get', object)
                }
                this.sets[object] = this.objects[object][key]
                this.objects[object][key].value = value
            }
            if (value in this.objects) {
                this.addPointers(value, object, key)
            }
            const element = document.querySelector(`.set.${object}`)
            if (element) element.scrollIntoView()
        }
        if (step.type === 'DELETE') {
            const { object, access, value } = step
            const [key] = access
            if (value) {
                const original = this.objects[object][key].value
                step.prev = original

                if (this.root.viz.types[object] !== 'Array') {
                    delete this.objects[object][key]
                }
                if (step.prev in this.objects) {
                    this.removePointers(step.prev, object, key)
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
            const [key] = access
            if (this.gets[object]) {
                const prop = this.gets[object]
                this.switchOff(prop, 'get', object)
                this.switchOff(prop, 'set', object)
            }
            if (allowRender) {
                if (allowRender) {
                    if (this.gets[object] === this.objects[object][key]) {
                        this.gets[object].get = false
                    }
                    this.objects[object][key].get = true
                    this.switchOff(this.objects[object][key], 'set', object)
                }
            }
            this.gets[object] = this.objects[object][key]
            const element = document.querySelector(`.get.${object}`)
            if (element) element.scrollIntoView()
        }
        if (allowRender) this.setBindings()
    }
    @action prev(step: Viz.Step.Any) {
        if (step.type === 'SET') {
            const { object, access } = step
            const [key] = access
            if ('prev' in step) {
                this.objects[object][key] = {
                    get: false,
                    set: false,
                    value: step.prev
                }
                if (typeof step.prev === 'string' && step.prev in this.objects) {
                    this.addPointers(step.prev, object, key)
                }
            } else {
                const val = this.objects[object][key]
                if (typeof val === 'string' && val in this.objects) {
                    this.removePointers(val, object, key)
                }
                delete this.objects[object][key]
            }
        }
        if (step.type === 'DELETE') {
            const { object, access, value } = step
            const [key] = access
            if (value) {
                this.objects[object][key] = {
                    get: false,
                    set: true,
                    value: step.prev
                }
                if (step.prev in this.objects) {
                    this.addPointers(step.prev, object, key)
                }
            }
        }
        if (step.type === 'CLEAR') {
            const { object } = step
            this.objects[object] = step.prev
        }
        if (step.type === 'GET') {
            const { object, access, value } = step;
            const [key] = access
            this.objects[object][key] = {
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
    getAffinity(parent: string, child: string): number {
        const hashTypes = ['Object', 'Map', 'Set']
        const parentType = this.root.viz.types[parent]
        const childType = this.root.viz.types[child]
        if (parentType === childType) {
            if (parentType === 'Array') {
                return 2
            }
            if (hashTypes.includes(parentType)) {
                return 0
            }
            return 4
        }
        if (childType === 'Array') {
            if (hashTypes.includes(parentType)) {
                return 1
            }
            return 3
        }
        if (hashTypes.includes(childType)) {
            if (!hashTypes.includes(parentType) && parentType !== 'Array') {
                return 3
            }
            return 0
        }
        if (parentType === 'Array') {
            if (this.parents[parent].size) {
                const [firstParent] = this.parents[parent].entries().next().value
                const type = this.root.viz.types[firstParent];
                if (type !== 'Array' && !hashTypes.includes(type)) {
                    return 2
                }
            }
            return 0
        }
        if (['Object', 'Map'].includes(parentType)) {
            if (this.parents[parent].size) return 1
        }
        if (!hashTypes.includes(parentType) && !hashTypes.includes(childType)) {
            return 3
        }
        return 0
    }

}


export default Structures