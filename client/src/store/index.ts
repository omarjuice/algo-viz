import VizStore from './viz';
import CodeStore from './code'
import IteratorStore from './iterator';
import StateStore from './state';
export class RootStore {
    viz: VizStore
    code: CodeStore
    iterator: IteratorStore
    state: StateStore
    constructor() {
        this.viz = new VizStore(this)
        this.iterator = new IteratorStore(this)
        this.code = new CodeStore(this)
        this.state = new StateStore(this)
    }
}

export default new RootStore()