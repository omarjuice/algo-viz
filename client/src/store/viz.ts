import { observable } from 'mobx';
import data from './sample.json'
import { RootStore } from './index';

export default class VizStore {
    @observable code: string = data.code
    @observable steps: Object[] = data.steps
    @observable objects: Object = data.objects
    @observable types: Object = data.types
    root: RootStore
    constructor(store: RootStore) {
        this.root = store
    }
}

