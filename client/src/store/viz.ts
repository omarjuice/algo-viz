import { observable } from 'mobx';
import { RootStore } from './index';

export default class VizStore {
    @observable code: string;
    @observable steps: Viz.Step.Any[];
    @observable objects: { [objectId: string]: Object };
    @observable types: { [objectId: string]: string };
    @observable objectIndex: { [index: string]: string[] };
    @observable runtime: number
    root: RootStore
    constructor(store: RootStore, data: Viz.Data) {
        this.root = store
        this.steps = data.steps
        this.code = data.code
        this.objects = data.objects
        this.types = data.types
        this.objectIndex = data.objectIndex
        this.runtime = data.runtime
    }
}

