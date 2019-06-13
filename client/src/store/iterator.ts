import { observable, action } from "mobx";
import VizStore from './viz';
import { RootStore } from ".";
import * as TYPES from '../types'

class IteratorStore {
    @observable index: number = -1
    @observable step: any
    @observable name: void | TYPES.name
    viz: VizStore
    root: RootStore
    constructor(store: RootStore) {
        this.root = store
        this.viz = store.viz
    }
    @action next() {
        this.step = this.viz.steps[++this.index]
        this.name = this.step.name
        this.root.code.update()
    }
}
export default IteratorStore