import { observable, action } from "mobx";
import store, { RootStore } from ".";

class Editor {
    @observable code: string = ''
    @observable active: boolean = false
    root: RootStore
    constructor(store: RootStore, code: string) {
        this.root = store
        this.code = code
    }
    @action submit() {
        this.root.api.runCode(this.code).then(() => {
            if (this.active && !this.root.api.error) this.toggle()
        })
    }
    @action toggle() {
        this.active = !this.active
        this.root.allowRender = !this.active;
        console.log(this.root.allowRender);
        if (this.root.allowRender && this.root.iterator.index > -1) {
            this.root.iterator.reset()
        }
        this.root.api.error = null
    }

}

export default Editor