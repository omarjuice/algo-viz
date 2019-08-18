import { observable, action } from "mobx";
import { RootStore } from ".";

class Structures {
    @observable objects: { [id: string]: Viz.Structure } = {}
    @observable gets: { [id: string]: Viz.StructProp } = {}
    @observable sets: { [id: string]: Viz.StructProp } = {}
    @observable pointers: Map<string, Viz.pointers> = new Map()
    @observable bindings: Set<string> = new Set()
    @observable children: { [id: string]: Set<string> } = {}
    @observable parents: { [id: string]: Set<string> } = {}
    @observable activePointers: { [id: string]: boolean } = {}
    @observable positions: { [id: string]: { x: number, y: number, radius: number, renderId: string } } = {}
    @observable renderMaps: { [id: string]: Viz.RenderMap } = {}
    root: RootStore
    constructor(store: RootStore) {
        this.root = store
        const objs = store.viz.objects
        for (const id in objs) {
            if (!this.pointers.has(id)) this.pointers.set(id, new Map())
            if (!this.children[id]) this.children[id] = new Set()
            if (!this.parents[id]) this.parents[id] = new Set()
            const obj: { [key: string]: any } = objs[id]
            const cloned: Viz.Structure = new Map()
            const type = this.root.viz.types[id]
            if (!type) return
            if (!this.root.settings.structColors[type] || !this.root.settings.structSettings[type]) {
                this.root.settings.addStruct(type)
            }
            if (type === 'Array') {
                for (let i = 0; i < obj['length']; i++) {
                    const val = obj[i]
                    cloned.set(i, {
                        get: false,
                        set: false,
                        value: val
                    });
                    if (val in objs) {
                        this.addPointers(val, id, i)
                    }
                }
                cloned.set('length', {
                    get: false,
                    set: false,
                    value: obj['length']
                })
            } else if (type === 'Map') {
                let count = 0;
                while (count in obj) {
                    const [key, value] = obj[count++];
                    cloned.set(key, {
                        get: false,
                        set: false,
                        value,
                    })
                    if (value in objs) {
                        this.addPointers(value, id, key)
                    }
                }
            } else if (type === 'Set') {
                let count = 0;
                while (count in obj) {
                    const value = obj[count++];
                    cloned.set(value, {
                        get: false,
                        set: false,
                        value,
                    })
                }
            } else {
                for (const key in obj) {
                    const value = obj[key]
                    cloned.set(key, {
                        get: false,
                        set: false,
                        value
                    })
                    if (value in objs) {
                        this.addPointers(value, id, key)
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
        const deletes: Set<string> = new Set()
        ids.forEach(id => {
            const seen: Set<string> = new Set()
            seen.add(id)
            let current = id
            let parents = this.parents[id]
            let isCircular = false
            while (parents && parents.size) {
                const parent = parents.values().next().value
                // if (!ids.has(parent)) {
                //     break // only active parents allowed?
                // }
                current = parent
                parents = this.parents[current]
                if (seen.has(current)) {
                    isCircular = true
                    break;
                }
                seen.add(current)
            }
            if (!isCircular && current !== id) {
                deletes.add(id)
                ids.add(current)
            }
        })
        deletes.forEach((id) => {
            ids.delete(id)
        })
        this.bindings.forEach(id => {
            if (!ids.has(id)) {
                delete this.positions[id]
            }
        })
        this.bindings = ids
    }
    @action addPointers(id: string, parent: string, key: string | number) {
        if (id !== parent) {
            let changed = false
            const parentType = this.root.viz.types[parent]
            const isChild = key in this.root.settings.structSettings[parentType].order
            if (!isChild && !['Object', 'Map', 'Array'].includes(parentType)) return
            if (!this.pointers.has(id)) this.pointers.set(id, new Map())
            if (!this.children[id]) this.children[id] = new Set()
            if (!this.parents[id]) this.parents[id] = new Set()
            const parents = this.pointers.get(id)
            let refs;
            if (parents) {
                refs = parents.get(parent)
                if (refs) {
                    refs.push(key)
                } else {
                    parents.set(parent, [key])
                }
            }
            const currentParents = this.parents[id]
            const affinity = this.getAffinity(parent, id)
            if (affinity > 0) {

                if (!currentParents.size) {
                    changed = true
                    currentParents.add(parent)
                    this.children[parent].add(id)
                } else {
                    const entries = currentParents.values()
                    const first = entries.next().value
                    if (affinity > this.getAffinity(first, id)) {
                        changed = true
                        currentParents.delete(first)
                        currentParents.add(parent)
                        this.children[first].delete(id)
                        this.children[parent].add(id)
                    } else if (first === parent) {
                        if (key !== refs[0]) {
                            changed = true
                        }
                    }
                }

            }

            if (changed) delete this.positions[id]
        }
    }

    @action removePointers(id: string, parent: string, ref: string | number) {
        const parents = this.pointers.get(id)
        let changed = false
        if (parents) {
            const refs = parents.get(parent)
            if (refs) {
                const curr = refs[0]
                for (let i = 0; i < refs.length; i++) {
                    if (refs[i] === ref) {
                        if (refs.splice(i, 1)[0] === curr) changed = true
                    }
                }
                if (!refs.length) {
                    parents.delete(parent)
                    this.children[parent].delete(id)
                    this.parents[id].delete(parent)
                    if (!this.parents[id].size) {
                        let bestParent: { objectId: string, affinity: number } = { objectId: '', affinity: 0 }
                        parents.forEach((keys, objectId) => {
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
        if (changed) delete this.positions[id]

    }

    @action next(step: Viz.Step.Any) {
        const { allowRender } = this.root
        if (step.type === 'SET') {
            const { object, access, value } = step
            const [key] = access
            if (this.objects[object].has(key)) {
                step.prev = this.objects[object].get(key).value
                if (step.prev in this.objects) {
                    this.removePointers(step.prev, object, key)
                }

            }
            if (this.sets[object]) {
                const prop = this.sets[object]
                this.switchOff(prop, 'get')
                this.switchOff(prop, 'set')
            }
            if (this.root.viz.types[object] === 'Array' && typeof key === 'number') {
                const len = this.objects[object].get('length');
                if (key >= len.value) {
                    for (let i = len.value; i < key; i++) {
                        this.objects[object].set(i, {
                            value: null,
                            get: false,
                            set: false
                        })
                    }
                    len.value = key + 1
                }
            }
            if (!this.objects[object].has(key)) {
                this.objects[object].set(key, {
                    get: false,
                    set: true,
                    value
                })
                this.sets[object] = this.objects[object].get(key)
            } else {
                if (allowRender) {
                    if (this.sets[object] === this.objects[object].get(key)) {
                        this.sets[object].set = false
                    }
                    this.objects[object].get(key).set = true
                    this.switchOff(this.objects[object].get(key), 'get')
                }

                this.sets[object] = this.objects[object].get(key)
                this.objects[object].get(key).value = value
            }
            if (value in this.objects) {
                this.addPointers(value, object, key)
            }

            // const element = document.querySelector(`.set.${object}`)
            // if (element) element.scrollIntoView()
            this.scrollIntoView('set', object)
        }
        if (step.type === 'DELETE') {
            const { object, access, value } = step
            const [key] = access
            if (value) {
                const original = this.objects[object].get(key).value
                step.prev = original
                if (this.root.viz.types[object] !== 'Array') {
                    this.objects[object].delete(key)
                } else {
                    this.objects[object].get(key).value = null
                }
                if (step.prev in this.objects) {
                    this.removePointers(step.prev, object, key)
                }
            }
        }
        if (step.type === 'CLEAR') {
            const { object } = step
            step.prev = this.objects[object]
            this.objects[object].clear()
        }
        if (step.type === 'GET') {
            const { object, access } = step
            const [key] = access
            if (this.gets[object]) {
                const prop = this.gets[object]
                this.switchOff(prop, 'get')
                this.switchOff(prop, 'set')
            }
            if (allowRender) {
                const prop = this.objects[object].get(key)
                if (this.gets[object] === prop) {
                    this.gets[object].get = false
                }
                prop.get = true
                this.switchOff(prop, 'set')
            }

            this.gets[object] = this.objects[object].get(key)
            this.scrollIntoView('get', object)
        }
        if (allowRender) this.setBindings()
    }
    scrollIntoView(type: 'get' | 'set', object: string) {
        const element = document.querySelector(`.${type}.${object}`)
        if (element) {
            const { top } = element.getBoundingClientRect()
            if (top < this.root.windowHeight && top > 0) {
                element.scrollIntoView()
            }
        }
    }
    @action prev(step: Viz.Step.Any) {
        if (step.type === 'SET') {
            const { object, access } = step
            const [key] = access
            const info = this.objects[object].get(key)
            if (info && typeof info.value === 'string' && info.value in this.objects) {
                this.removePointers(info.value, object, key)
            }
            if ('prev' in step) {
                this.objects[object].set(key, {
                    get: false,
                    set: false,
                    value: step.prev
                })
                if (typeof step.prev === 'string' && step.prev in this.objects) {
                    this.addPointers(step.prev, object, key)
                }
            } else {
                this.objects[object].delete(key)
            }

        }
        if (step.type === 'DELETE') {
            const { object, access, value } = step
            const [key] = access
            if (value) {
                this.objects[object].set(key, {
                    get: false,
                    set: true,
                    value: step.prev
                })
                if (step.prev in this.objects) {
                    this.addPointers(step.prev, object, key)
                }
            }
        }
        if (step.type === 'CLEAR') {
            const { object } = step
            this.objects[object] = step.prev
        }
        // if (step.type === 'GET') {
        //     const { object, access, value } = step;
        //     const [key] = access
        //     this.objects[object].set(key, {
        //         get: false,
        //         set: false,
        //         value
        //     })

        // }

    }
    @action reset() {
        for (const key in this.gets) {
            this.switchOff(this.gets[key], 'get')
            this.switchOff(this.gets[key], 'set')

        }
        for (const key in this.sets) {
            this.switchOff(this.sets[key], 'get')
            this.switchOff(this.sets[key], 'set')

        }
    }
    @action resetPositions = () => {
        for (const key in this.positions) {
            delete this.positions[key]
        }
        this.setBindings()
    };
    @action async switchOff(prop: Viz.StructProp, key: 'get' | 'set') {
        prop[key] = false
    }
    @action setPosition(id: string, e: HTMLDivElement, renderId: string) {
        const { top, left, width, height } = e.getBoundingClientRect()
        const radius = width / 2
        const y = top + (height / 2)
        const x = left + (radius)
        const pos = this.positions[id]
        if (!pos || pos.x !== x || pos.y !== y || pos.renderId !== renderId) {
            this.positions[id] = { x, y, renderId, radius }
        }
    }
    getAffinity(parent: string, child: string): number {
        const _this = this
        const val = (function () {
            const hashTypes = ['Object', 'Map', 'Set']
            const parentType = _this.root.viz.types[parent]
            const childType = _this.root.viz.types[child]
            if (parentType === childType) {
                if (parentType === 'Array') {
                    return 2
                }
                if (hashTypes.includes(parentType)) {
                    return 0
                }
                return 4
            }
            if (!hashTypes.includes(parentType) && !hashTypes.includes(childType) && parentType !== 'Array' && childType !== 'Array') {
                return 3
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
                if (_this.parents[parent].size) {
                    const [firstParent] = _this.parents[parent].entries().next().value
                    const type = _this.root.viz.types[firstParent];
                    if (type !== 'Array' && !hashTypes.includes(type)) {
                        return 2
                    }
                }
                return 0
            }
            if (['Object', 'Map'].includes(parentType)) {
                if (_this.parents[parent].size) return 2
            }

            return 0
        })()
        return val
    }

}


export default Structures