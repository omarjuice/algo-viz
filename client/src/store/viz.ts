import { observable } from 'mobx';
import { RootStore } from './index';

export default class VizStore {
    @observable code: string;
    @observable steps: Viz.Step.Any[];
    @observable objects: { [key: string]: Object };
    @observable types: { [key: string]: string };
    root: RootStore
    constructor(store: RootStore, data: Viz.Data) {
        this.root = store
        this.steps = data.steps
        console.log(data.steps[data.steps.length - 1]);
        this.code = data.code
        this.objects = data.objects
        this.types = data.types
    }
}

