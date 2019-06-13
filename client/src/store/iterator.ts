import { observable, action } from "mobx";
import { RootStore } from ".";
import * as TYPES from '../types'

class IteratorStore {
    @observable index: number = -1
    @observable step: any
    @observable name: void | TYPES.name
    root: RootStore
    constructor(store: RootStore) {
        this.root = store
    }
    @action next() {
        this.step = this.root.viz.steps[++this.index]
        this.name = this.step.name
        this.root.code.update()
    }
}
export default IteratorStore