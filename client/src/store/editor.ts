import { observable } from "mobx";
import { RootStore } from ".";

class Editor {
    @observable code: string = ''
    @observable active: boolean = false
    root: RootStore
    constructor(store: RootStore, code: string) {
        this.root = store
        this.code = code
    }
    submit() {
        this.root.api.runCode(this.code)
    }

}

export default Editor