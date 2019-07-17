import { observable, action } from "mobx";
import { RootStore } from ".";

export const structInfo: Viz.structSettings = {
    BST: {
        order: {
            left: {
                pos: 1,
                isMultiple: false
            },
            right: {
                pos: 2,
                isMultiple: false
            }
        },
        main: 'value',
        numChildren: 2,
        pointers: {

        }
    },
    DLL: {
        order: {
            next: {
                pos: 1,
                isMultiple: false
            },
        },
        main: 'value',
        numChildren: 1,
        pointers: {
            prev: false
        }
    },
    SLL: {
        order: {
            next: {
                pos: 1,
                isMultiple: false
            },
        },
        main: 'value',
        numChildren: 1,
        pointers: {
        }
    },
    BTree: {
        order: {
            left: {
                pos: 1,
                isMultiple: false
            },
            right: {
                pos: 2,
                isMultiple: false
            }
        },
        main: 'value',
        numChildren: 2,
        pointers: {

        }
    }
}

class Settings {
    @observable valueColors = {
        special: '#255e4f',
        number: 'steelblue',
        string: 'yellow',
        boolean: 'green',
        other: 'white'
    }
    @observable background = '#0b1423'
    @observable speeds = {
        DECLARATION: 5,
        ASSIGNMENT: 5,
        EXPRESSION: 5,
        CALL: 5,
        DELETE: 3,
        GET: 3,
        SET: 3,
        CLEAR: 3
    }
    @observable editing: boolean = false
    @observable structColors: Viz.structColors = {
        Array: 'whitesmoke',
        Object: 'fucshia',
        Map: 'steelblue',
        Set: 'pink'
    }
    @observable structSettings: Viz.structSettings = {}
    @observable root: RootStore
    constructor(store: RootStore) {
        const settings = window.localStorage.getItem('settings')
        if (settings) {
            const all: Viz.AllSettings = JSON.parse(settings)
            console.log(all);
            this.background = all.background
            this.valueColors = all.valueColors
            this.speeds = all.speeds
            this.structColors = all.structColors
            this.structSettings = all.structSettings
        }
        this.structSettings['Array'] = {
            order: {},
            main: 'value',
            numChildren: null,
            pointers: {}
        }
        this.structSettings['Object'] = {
            order: {},
            main: 'value',
            numChildren: null,
            pointers: {}
        }
        for (const name in structInfo) {
            const newName = 'Viz.' + name
            this.structSettings[newName] = structInfo[name]
            if (!this.structColors[newName]) {
                this.setColor(newName)
            }
        }

        this.root = store
        window.onbeforeunload = () => {
            delete this.root
            window.localStorage.setItem('settings', JSON.stringify(this))
        }
    }
    @action startEdit() {
        this.editing = true
        if (this.root.iterator) {
            this.root.iterator.pause()
        }
    }
    @action stopEdit() {
        this.editing = false
    }
    @action changeSpeed(type: string, value: string) {
        const val = Number(value)
        if (type in this.speeds) {
            if (val >= 0) {
                this.speeds[type as Viz.configurable] = val
            }
        }
    }
    @action addStruct(structType: string) {
        const restricted = ['Object', 'Array', 'Map', 'Set']
        if (restricted.includes(structType)) return
        if (!(structType in this.structSettings)) {
            this.structSettings[structType] = {
                order: {},
                main: 'value',
                numChildren: null,
                pointers: {}
            }
        }
        if (!(structType in this.structColors)) {
            this.setColor(structType)
        }
    }
    @action setColor(structType: string, color?: string) {
        if (!color) color = '#' + (Math.floor(Math.random() * (255 ** 3))).toString(16)
        this.structColors[structType] = color
    }
    @action deleteStruct(structType: string) {
        delete this.structColors[structType]
        delete this.structSettings[structType]
    }
}

export default Settings