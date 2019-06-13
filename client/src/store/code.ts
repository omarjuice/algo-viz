import { observable, action, computed } from "mobx";
import VizStore from './viz';
import { RootStore } from ".";

class Token {
    index: number
    char: string
    code: CodeStore
    constructor(char: string, idx: number, code: CodeStore) {
        this.char = char
        this.index = idx
        this.code = code
    }
    @computed get highlight() {
        const { start, end } = this.code;
        const sliceable = !(start === undefined || end === undefined)

        if (sliceable && this.index >= start && this.index <= end) {
            return true
        }
        return false
    }
}

class CodeStore {
    @observable tokenMap: Array<Token> = []
    viz: VizStore
    root: RootStore
    @observable start: void | number
    @observable end: void | number
    constructor(store: RootStore) {
        this.viz = store.viz
        this.root = store
        this.setCode(this.viz.code)

    }
    setCode(code: string) {
        this.tokenMap = code.split('').map((char, i) => new Token(char, i, this))
    }
    @action update() {
        const name = this.root.iterator.name
        if (name) {
            const [start, end] = name;
            this.start = start
            this.end = end
        } else {
            this.start = undefined
            this.end = undefined
        }
        // console.log(this)
    }
}

export default CodeStore