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
            parent: false,
            root: false
        }
    },
    Queue: {
        order: {
            front: {
                pos: 1,
                isMultiple: false
            }
        },
        main: 'length',
        numChildren: 1,
        pointers: {
            end: false
        }
    },
    Node: {
        order: {
            next: {
                pos: 1,
                isMultiple: false
            }
        },
        main: 'value',
        numChildren: 1,
        pointers: {
            prev: false
        }
    },
    PQ: {
        order: {
            heap: {
                pos: 1,
                isMultiple: false
            }
        },
        main: 'display',
        numChildren: 1,
        pointers: {

        }
    },
    Tree: {
        order: {
            leaf: {
                pos: 1,
                isMultiple: false
            },
            children: {
                pos: 2,
                isMultiple: true
            }
        },
        main: 'key',
        numChildren: null,
        pointers: {}
    },
    Leaf: {
        order: {},
        main: 'value',
        numChildren: null,
        pointers: {}
    },
    Trie: {
        order: {
            children: {
                pos: 1,
                isMultiple: true
            }
        },
        main: 'value',
        numChildren: null,
        pointers: {}
    }
}

class Settings {
    @observable valueColors = {
        special: '#255e4f',
        number: 'steelblue',
        string: 'yellow',
        boolean: 'green',
        other: 'white',
        func: 'white',
        native: '#ff3860'
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
            this.background = all.background
            // this.valueColors = this.valueColors
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
        this.structSettings['Map'] = {
            order: {},
            main: 'value',
            numChildren: null,
            pointers: {}
        }
        this.structSettings['Set'] = {
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
    @action changeSpeed(type: string, val: number) {
        if (type in this.speeds) {
            if (val >= 0) {
                this.speeds[type as Viz.configurable] = val
            }
        }
    }
    @action addStruct(structType: string) {
        const restricted = ['Object', 'Array', 'Map', 'Set']
        if (!(structType in this.structColors)) {
            this.setColor(structType)
        }
        if (restricted.includes(structType)) return

        if (!(structType in this.structSettings)) {
            this.structSettings[structType] = {
                order: {},
                main: 'value',
                numChildren: null,
                pointers: {}
            }
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