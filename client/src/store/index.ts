import VizStore from './viz';
import CodeStore from './code'
import IteratorStore from './iterator';
export class RootStore {
    viz: VizStore
    code: CodeStore
    iterator: IteratorStore
    constructor() {
        this.viz = new VizStore(this)
        this.iterator = new IteratorStore(this)
        this.code = new CodeStore(this)
        this.iterator.next()
    }
}

export default new RootStore()