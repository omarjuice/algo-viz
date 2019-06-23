import { observable } from 'mobx';
import VizStore from './viz';
import CodeStore from './code'
import IteratorStore from './iterator';
import StateStore from './state';
import ApiStore from './api';
import Editor from './editor';
export class RootStore {
    @observable viz: VizStore
    @observable code: CodeStore
    @observable iterator: IteratorStore
    @observable state: StateStore
    @observable api: ApiStore
    @observable editor: Editor
    @observable ready: boolean = false
    @observable allowRender: boolean = true

    constructor() {
        const data = window.localStorage.getItem('data')
        this.api = new ApiStore(this)
        if (data) {
            this.initialize(JSON.parse(data))
        }
    }
    initialize(data: Viz.Data) {
        this.viz = new VizStore(this, data)
        this.iterator = new IteratorStore(this)
        this.code = new CodeStore(this)
        this.state = new StateStore(this)
        this.editor = new Editor(this, this.viz.code.trim())
        this.ready = true
        this.iterator.play()
    }
}

export default new RootStore()