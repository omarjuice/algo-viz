import { observable, action, computed } from 'mobx';
import VizStore from './viz';
import CodeStore from './code'
import IteratorStore from './iterator';
import StateStore from './state';
import ApiStore from './api';
import Editor from './editor';
import Structures from './structures';
import Settings from './settings';
import defaultData from './default.json'

type widths = {
    array: number
    object: number
    data: number
}
export class RootStore {
    dataVersion = 'data_V1'
    @observable tutorial: boolean = false
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
    @observable windowHeight: number = window.innerHeight
    @observable widths: widths = {
        array: 0,
        object: 0,
        data: 0
    }
    @observable numStructs: number[] = [0, 0, 0]
    minWidth = 850
    constructor() {
        this.api = new ApiStore(this)
        const data = window.localStorage.getItem(this.dataVersion)
        this.settings = new Settings(this)

        if (data) {
            this.initialize(JSON.parse(data))
        } else {
            // @ts-ignore
            this.initialize(defaultData as Viz.Data)
        }
        this.editor = new Editor(this, this.viz ? this.viz.code.trim() : '')

        window.onresize = () => {
            this.onWindowResize(window.innerWidth, window.innerHeight)
        }
        this.iterator.play();
        this.iterator.pause()

    }
    @action initialize(data: Viz.Data) {
        if (this.iterator) this.iterator.cleanUp();
        this.viz = new VizStore(this, data)
        this.iterator = new IteratorStore(this)
        this.code = new CodeStore(this)
        this.state = new StateStore(this)
        this.structs = new Structures(this)
        this.ready = true

    }
    @computed get isInvalidScreenWidth() {
        return this.windowWidth < this.minWidth
    }
    @computed get structsWidth() {
        const { config } = this.settings;

        if (!config.Objects) return 0;

        let width = 12;
        if (config['Identifiers'] || config['Code Display']) {
            width -= 4;
        }
        if (config['Callstack']) {
            width -= 2
        }

        return width
    }
    @action private onWindowResize(width: number, height: number) {
        if (width !== this.windowWidth) {
            this.windowWidth = width
        }
        if (height !== this.windowHeight) {
            this.windowHeight = height
        }
    }
    @action setWidths(vals: widths, [numArrays, numObjects, numData]: number[]) {
        this.widths.array = vals.array
        this.widths.object = vals.object
        this.widths.data = vals.data

        this.numStructs[0] = numArrays;
        this.numStructs[1] = numObjects;
        this.numStructs[2] = numData
    }
    @action startTutorial() {
        if (this.iterator) {
            this.iterator.pause()
        }
        this.tutorial = true
    }
    @action stopTutorial() {
        this.tutorial = false
    }
}

export default new RootStore()