import { observable, action } from 'mobx';
import VizStore from './viz';
import CodeStore from './code'
import IteratorStore from './iterator';
import StateStore from './state';
import ApiStore from './api';
import Editor from './editor';
import Structures from './structures';
import Settings from './settings';
export class RootStore {
    @observable settings: Settings
    @observable viz: VizStore
    @observable code: CodeStore
    @observable iterator: IteratorStore
    @observable state: StateStore
    @observable structs: Structures
    @observable api: ApiStore
    @observable editor: Editor
    @observable ready: boolean = false
    @observable allowRender: boolean = true
    @observable windowWidth: number = window.innerWidth
    constructor() {
        const data = window.localStorage.getItem('data')
        this.settings = new Settings(this)
        this.api = new ApiStore(this)
        if (data) {
            this.initialize(JSON.parse(data))
        }
        this.editor = new Editor(this, this.viz ? this.viz.code.trim() : '')
        window.onresize = () => {
            this.onWindowResize(window.innerWidth)
        }

    }
    initialize(data: Viz.Data) {
        this.viz = new VizStore(this, data)
        this.iterator = new IteratorStore(this)
        this.code = new CodeStore(this)
        this.state = new StateStore(this)
        this.structs = new Structures(this)
        this.ready = true
        // this.iterator.play()
    }
    @action onWindowResize(val: number) {
        console.log(val);
        this.windowWidth = val
    }
}

export default new RootStore()