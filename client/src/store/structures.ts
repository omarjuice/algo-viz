import { observable, action, computed } from "mobx";
import { RootStore } from ".";


class Structures {
    @observable objects: { [id: string]: Viz.Structure } = {}

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
                    highlight: 0,
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
}


export default Structures