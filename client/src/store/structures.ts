import { observable, action } from "mobx";
import { RootStore } from ".";
import PointerQueue from './pointerqueue';



class Structures {
    @observable objects: { [id: string]: Viz.Structure } = {}
    @observable inactiveObjects: { [id: string]: Viz.Structure } = {}
    @observable childKeyMemo: { [id: string]: Map<any, string> } = {}
    @observable gets: { [id: string]: Viz.StructProp } = {}
    @observable sets: { [id: string]: Viz.StructProp } = {}
    @observable pointers: Map<string, PointerQueue> = new Map()
    @observable bindings: Set<string> = new Set()
    @observable children: { [id: string]: Set<string> } = {}
    @observable parents: { [id: string]: string } = {}
    @observable activePointers: { [id: string]: boolean } = {}
    @observable positions: Viz.ojectPositions = {}
    @observable renderMaps: { [id: string]: Viz.RenderMap } = {}
    root: RootStore
    constructor(store: RootStore) {
        this.root = store
        const objs = this.root.viz.objects
        for (const id in objs) {
            if (!this.pointers.has(id)) this.pointers.set(id, new PointerQueue(this, id))
            if (!this.children[id]) this.children[id] = new Set()
            if (!this.childKeyMemo[id]) this.childKeyMemo[id] = new Map()
            if (!(id in this.parents)) this.parents[id] = null;
            const obj: { [key: string]: any } = objs[id]
            const cloned: Viz.Structure = new Map()
            const type = this.root.viz.types[id]
            if (!type) return
            if (!this.root.settings.structSettings[type]) {
                this.root.settings.addStruct(type)
            }
            this.root.settings.dependentTypes.add(type)
            if (type === 'Array') {
                for (let i = 0; i < obj['length']; i++) {
                    const val = obj[i]
                    cloned.set(i, {
                        get: false,
                        set: false,
                        value: val
                    });
                    if (val in objs) {
                        this.childKeyMemo[id].set(i, val)
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
                        this.childKeyMemo[id].set(key, value)
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
                        this.childKeyMemo[id].set(key, value)
                    }
                }
            }
            this.inactiveObjects[id] = cloned
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
        const findParents = this.root.settings.config["Find Object Parents"]
        ids.forEach(id => {
            const seen: Set<string> = new Set()
            seen.add(id)
            let current = id
            let parent = this.parents[id]
            let isCircular = false
            let lastBoundParent;
            while (parent) {
                current = parent
                parent = this.parents[current]
                if (seen.has(current)) {
                    isCircular = true
                    break;
                }
                seen.add(current)
                if (ids.has(current)) {
                    lastBoundParent = current
                }
            }
            if (!isCircular && current !== id) {
                if (findParents) {
                    deletes.add(id)
                    ids.add(current)
                } else {
                    if (lastBoundParent) {
                        deletes.add(id)
                        ids.add(lastBoundParent)
                    }
                }
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
    @action addObject(id: string) {
        this.objects[id] = this.inactiveObjects[id];
        this.childKeyMemo[id].forEach((child, key) => {
            this.addPointers(child, id, key)
        })
    }
    @action removeObject(id: string) {
        delete this.objects[id]
        this.childKeyMemo[id].forEach((child, key) => {
            this.removePointers(child, id, key)
        })
    }
    @action addPointers(id: string, parent: string, key: string | number, idx = this.root.iterator.index) {
        if (id !== parent) {
            const parentType = this.root.viz.types[parent]
            const isChild = key in this.root.settings.structSettings[parentType].order
            if (!isChild && !['Object', 'Map', 'Array'].includes(parentType)) return
            if (!this.pointers.has(id)) this.pointers.set(id, new PointerQueue(this, id))
            if (!this.children[id]) this.children[id] = new Set()
            if (!(id in this.parents)) this.parents[id] = null
            const pointers = this.pointers.get(id)
            const prevParent = pointers.top
            pointers.insert(key, parent, idx);
            if (pointers.size && pointers.top !== prevParent) {
                const newParent = pointers.top;
                if (prevParent) this.children[prevParent.id].delete(id);
                this.children[newParent.id].add(id)
                this.parents[id] = newParent.id
                delete this.positions[id]
            }
        }
    }

    @action removePointers(id: string, parent: string, key: string | number): number {
        if (id !== parent) {
            const pointers = this.pointers.get(id);
            const prevParent = pointers.top;
            const pointer: Viz.objectPointer = pointers.findAndRemove(parent, key);
            if (!pointer) return null;
            if (!pointers.size) {
                this.parents[id] = null;
                if (pointer) this.children[pointer.id].delete(id)
            } else {
                const newParent = pointers.top;
                if (newParent && newParent !== prevParent) {
                    this.parents[id] = newParent.id;
                    this.children[prevParent.id].delete(id)
                    this.children[newParent.id].add(id)
                    delete this.positions[id]
                }
            }
            return pointer.index
        }
        return null;
    }

    @action next(step: Viz.Step.Any) {
        const { allowRender } = this.root
        if (this.root.iterator.index in this.root.viz.objectIndex) {
            this.root.viz.objectIndex[this.root.iterator.index].forEach(obj => {
                this.addObject(obj)
            })
        }
        if (step.type === 'SET') {
            const { object, access, value } = step
            const key = access
            if (this.objects[object].has(key)) {
                step.prev = this.objects[object].get(key).value
                if (step.prev in this.objects) {
                    step.prevPointerIdx = this.removePointers(step.prev, object, key)
                }

            }
            if (this.sets[object]) {
                const prop = this.sets[object]
                this.switchOff(prop, 'get')
                this.switchOff(prop, 'set')
            }
            if (this.root.viz.types[object] === 'Array') {
                const len = this.objects[object].get('length');
                if (typeof key === 'number') {
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
                if (key === 'length') {
                    if (value > len.value) {
                        for (let i = len.value; i < value; i++) {
                            this.objects[object].set(i, {
                                value: null,
                                get: false,
                                set: false
                            })
                        }
                    }
                }
            }
            if (this.root.viz.types)
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
            this.scrollIntoView('set', object)
        }
        if (step.type === 'DELETE') {
            const { object, access, value } = step
            const key = access
            if (value) {
                const original = this.objects[object].get(key).value
                step.prev = original
                if (this.root.viz.types[object] !== 'Array') {
                    this.objects[object].delete(key)
                } else {
                    this.objects[object].get(key).value = null
                }
                if (step.prev in this.objects) {
                    step.prevPointerIdx = this.removePointers(step.prev, object, key)
                }
            }
        }
        if (step.type === 'CLEAR') {
            const { object } = step
            step.prev = new Map(this.objects[object])
            this.objects[object].clear()
        }
        if (step.type === 'GET') {
            const { object, access } = step
            const key = access
            if (this.gets[object]) {
                const prop = this.gets[object]
                this.switchOff(prop, 'get')
                this.switchOff(prop, 'set')
            }
            if (allowRender) {
                const prop = this.objects[object].get(key)
                if (!prop) {
                    console.log(key);
                }
                if (this.gets[object] === prop) {
                    this.gets[object].get = false
                }

                prop.get = true
                this.switchOff(prop, 'set')
            }

            this.gets[object] = this.objects[object].get(key)
            const t = this.root.viz.types[object]
            if (!['Array', 'Map', 'Set'].includes(t)) {
                this.gets[object].value = step.value;
            }
            this.scrollIntoView('get', object)
        }
        if (allowRender) this.setBindings()
    }

    @action prev(step: Viz.Step.Any) {

        if (step.type === 'SET') {
            const { object, access } = step
            const key = access
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
                if (step.prev in this.objects) {
                    if (step.prevPointerIdx !== null) {
                        this.addPointers(step.prev, object, key, step.prevPointerIdx)
                    }
                }
            } else {
                this.objects[object].delete(key)
            }

        }
        if (step.type === 'DELETE') {
            const { object, access, value } = step
            const key = access
            if (value) {
                this.objects[object].set(key, {
                    get: false,
                    set: false,
                    value: step.prev
                })
                if (step.prev in this.objects) {
                    if (step.prevPointerIdx !== null) {
                        this.addPointers(step.prev, object, key, step.prevPointerIdx)
                    }
                }
            }
        }
        if (step.type === 'CLEAR') {
            const { object } = step
            this.objects[object] = step.prev
        }

        if (step.type === 'GET') {
            const { object, access } = step
            const key = access
            const prop = this.objects[object].get(key)
            if (this.root.viz.types[object] !== 'Array') {
                prop.value = step.value
            }
        }
        if (this.root.allowRender) this.setBindings()
        if (this.root.iterator.index in this.root.viz.objectIndex) {
            this.root.viz.objectIndex[this.root.iterator.index].forEach(obj => {
                this.removeObject(obj)
            })
        }

    }
    scrollIntoView(type: 'get' | 'set', object: string) {
        if (!this.root.settings.config["Scroll Objects Into View"]) return;
        const element = document.querySelector(`.${type}.${object}`)
        if (element) {
            const { top } = element.getBoundingClientRect()
            if (top < this.root.windowHeight && top > 0) {
                element.scrollIntoView()
            }
        }
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


}


export default Structures