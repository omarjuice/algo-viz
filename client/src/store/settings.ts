import { observable, action } from "mobx";
import { RootStore } from ".";

const SETTINGS_VERSION = 'settings'

const randomColor = (): string => {
    const color = (Math.floor(Math.random() * (16777215))).toString(16).padStart(6, '0');
    return '#' + color
}

export const jsStructInfo: Viz.structSettings = {
    "Viz.BST": {
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
        color: randomColor(),
        textColor: '#0b1423',
        pointers: {

        },

    },
    "Viz.DLL": {
        order: {
            next: {
                pos: 1,
                isMultiple: false
            },
        },
        main: 'value',
        numChildren: 1,
        color: randomColor(),
        textColor: '#0b1423',
        pointers: {
            prev: false
        }
    },
    "Viz.SLL": {
        order: {
            next: {
                pos: 1,
                isMultiple: false
            },
        },
        main: 'value',
        numChildren: 1,
        color: randomColor(),
        textColor: '#0b1423',
        pointers: {
        }
    },
    "Viz.BTree": {
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
        color: randomColor(),
        textColor: '#0b1423',
        pointers: {

        }
    },
    "Viz.Queue": {
        order: {
            front: {
                pos: 1,
                isMultiple: false
            }
        },
        main: 'length',
        numChildren: 1,
        color: randomColor(),
        textColor: '#0b1423',
        pointers: {
            end: false
        }
    },
    "Viz.Node": {
        order: {
            next: {
                pos: 1,
                isMultiple: false
            }
        },
        main: 'value',
        numChildren: 1,
        color: randomColor(),
        textColor: '#0b1423',
        pointers: {
            prev: false
        }
    },
    "Viz.PQ": {
        order: {
            heap: {
                pos: 1,
                isMultiple: false
            }
        },
        main: 'display',
        numChildren: 1,
        color: randomColor(),
        textColor: '#0b1423',
        pointers: {

        }
    },
    "Viz.Tree": {
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
        color: randomColor(),
        textColor: '#0b1423',
        pointers: {}
    },
    "Viz.Leaf": {
        order: {},
        main: 'value',
        numChildren: null,
        color: randomColor(),
        textColor: '#0b1423',
        pointers: {}
    },
    "Viz.Trie": {
        order: {
            children: {
                pos: 1,
                isMultiple: true
            }
        },
        main: 'value',
        numChildren: null,
        color: randomColor(),
        textColor: '#0b1423',
        pointers: {}
    },
    default: {
        order: {},
        main: 'value',
        numChildren: null,
        color: randomColor(),
        textColor: '#0b1423',
        pointers: {}
    }
}

export const pyStructInfo: Viz.structSettings = {
    ChainMap: {
        order: {
            maps: {
                pos: 1,
                isMultiple: true
            }
        },
        main: null,
        numChildren: null,
        color: randomColor(),
        textColor: '#0b1423',
        pointers: {}
    },
    deque: {
        order: {
            front: {
                pos: 1,
                isMultiple: false
            }
        },
        main: 'length',
        numChildren: 1,
        color: randomColor(),
        textColor: '#0b1423',
        pointers: {
            end: false
        }
    },
    'deque.block': {
        order: {
            next: {
                pos: 1,
                isMultiple: false
            }
        },
        main: 'value',
        numChildren: 1,
        color: randomColor(),
        textColor: '#0b1423',
        pointers: {
            prev: false
        }
    }
}

Object.defineProperty(jsStructInfo, 'default', {
    value: jsStructInfo['default'],
    enumerable: false
})

const configColorDefaults: Viz.configColors = {
    'Primary Background': '#0b1423',
    'Secondary Background': '#4a4a4a',
    'Call Stack': '#ffa500',
    'Code': '#f5f5f5',
    'Code Highlight': '#98fb98',
    'Step Slider Track': '#a663cc',
    'Step Slider Rail': '#c2bbf0',
    'Step Slider Handle': '#0000ff',
    'Step Type': '#808080',
    'Text': '#f5f5f5',
    'Line Pointer': '#FFFFFF',
    'Arc Pointer': '#FFFFFF',
    'Line Pointer: GET': '#23D160',
    'Line Pointer: SET': '#A663CC',
    'Arc Pointer: GET': '#23D160',
    'Arc Pointer: SET': `#A663CC`
}
const valueColorDefaults: Viz.valueColors = {
    special: '#255e4f',
    number: '#4682b4',
    string: '#ffff00',
    boolean: '#00ff00',
    other: '#ff69b4',
    func: '#ffffff',
    native: '#ff3860'
}

class Settings {
    @observable dependentTypes: Set<string> = new Set()
    valueColorDefaults: Viz.valueColors = valueColorDefaults
    @observable valueColors: Viz.valueColors = { ...valueColorDefaults }
    configColorDefaults: Viz.configColors = configColorDefaults
    @observable configColors: Viz.configColors = { ...configColorDefaults }
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

    @observable structSettings: Viz.structSettings = {

    }
    @observable config: Viz.configSettings = {
        'Callstack': true,
        'Code Display': true,
        'Identifiers': true,
        'Objects': true,
        'Step View': true,
        'tooltips': false,
        'Active Pointer on GET': false,
        'Scroll Objects Into View': false,
        'Find Object Parents': true

    }
    @observable root: RootStore

    @observable unconfigurables: Set<string> = new Set()
    @observable hashTypes: Set<string> = new Set()
    @observable arrayTypes: Set<string> = new Set()
    @observable setTypes: Set<string> = new Set()
    @observable mapTypes: Set<string> = new Set()
    @observable viableParents: Set<string> = new Set()
    @observable jsStructSettings: Viz.structSettings = {}
    @observable pyStructSettings: Viz.structSettings = {}
    constructor(store: RootStore) {
        const lang = store.language
        const settings = window.localStorage.getItem(SETTINGS_VERSION)
        if (settings) {
            const all: Viz.StoredSettings = JSON.parse(settings)
            //@ts-ignore
            const valueColors: Viz.valueColors = {}
            for (const key in this.valueColors) {
                //@ts-ignore
                valueColors[key] = key in all.valueColors ? all.valueColors[key] : this.valueColors[key]
            }
            this.valueColors = valueColors

            //@ts-ignore
            const configColors: Viz.configColors = {}

            for (const key in this.configColors) {
                //@ts-ignore
                configColors[key] = key in all.configColors ? all.configColors[key] : this.configColors[key]
            }
            this.configColors = configColors



            this.speeds = { ...this.speeds, ...all.speeds }



            //@ts-ignore
            const structSettings: Viz.structSettings = {}

            let strSettings: 'jsStructSettings' | 'pyStructSettings' | null

            if (lang === 'javascript' && 'jsStructSettings' in all) {
                strSettings = 'jsStructSettings'
            } else if (lang === 'python' && 'pyStructSettings' in all) {
                strSettings = 'pyStructSettings'
            }

            if (all.jsStructSettings) {
                this.jsStructSettings = all['jsStructSettings']
            }
            if (all.pyStructSettings) {
                this.pyStructSettings = all['pyStructSettings']
            }

            if (strSettings) {
                for (const objType in all[strSettings]) {
                    //@ts-ignore
                    const objSettings = {}
                    for (const key in jsStructInfo.default) {
                        //@ts-ignore
                        objSettings[key] = key in all[strSettings][objType] ? all[strSettings][objType][key] : jsStructInfo.default[key]
                    }
                    //@ts-ignore
                    structSettings[objType] = objSettings
                }
                this.structSettings = structSettings
            }


            this.config = { ...this.config, ...all.config }

        }
        let unconfigurables: [string, string][];

        if (lang === 'javascript') {
            unconfigurables = [['Array', '#FFFFFF'], ['Object', '#FFFFFF'], ['Map', '#4682B4'], ['Set', '#FF69B4']]
            this.arrayTypes.add('Array')
            this.setTypes.add('Set')
            this.hashTypes.add('Map')
            this.hashTypes.add('Object')
            this.hashTypes.add('Set')
            this.mapTypes.add('Map')
            this.viableParents.add('Array')
            this.viableParents.add('Object')
            this.viableParents.add('Map')

        } else if (lang === 'python') {
            unconfigurables = [['list', '#FFFFFF'], ['dict', '#FFFFFF'], ['set', '#FF69B4'], ['Counter', '#4682B4'], ['OrderedDict', '#21AF74'], ['defaultdict', '#800080']]
            this.arrayTypes.add('list')
            this.setTypes.add('set')
            this.hashTypes.add('dict')
            this.hashTypes.add('Counter')
            this.hashTypes.add('OrderedDict')
            this.hashTypes.add('defaultdict')
            this.hashTypes.add('set')
            this.mapTypes.add('dict')
            this.mapTypes.add('defaultdict')
            this.mapTypes.add('OrderedDict')
            this.viableParents.add('list')
            this.viableParents.add('dict')
            this.viableParents.add('defaultdict')
            this.viableParents.add('OrderedDict')
        }
        for (const [t] of unconfigurables) {
            this.unconfigurables.add(t)
        }

        for (const [t, defaultColor] of unconfigurables) {
            this.structSettings[t] = {
                order: {},
                main: 'value',
                numChildren: null,
                pointers: {},
                color: t in this.structSettings && this.structSettings[t].color ? this.structSettings[t].color : defaultColor,
                textColor: this.configColors["Primary Background"]
            }
        }
        let structInfo;
        if (lang === 'javascript') {
            structInfo = jsStructInfo
        } else if (lang === 'python') {
            structInfo = pyStructInfo
        }
        for (const name in structInfo) {
            this.structSettings[name] = {
                ...structInfo[name],
                color: name in this.structSettings ? this.structSettings[name].color : structInfo[name].color,
                textColor: name in this.structSettings ? this.structSettings[name].textColor : structInfo[name].textColor,
                pointers: {
                    ...(this.structSettings[name] || { pointers: {} }).pointers,
                    ...structInfo[name].pointers
                }
            }
        }


        this.root = store

        window.onbeforeunload = () => {
            delete this.root
            const storageSettings: Viz.StoredSettings = {
                speeds: this.speeds,
                valueColors: this.valueColors,
                configColors: this.configColors,
                config: this.config,
            }
            if (lang === 'javascript') {
                storageSettings.jsStructSettings = this.structSettings
                storageSettings.pyStructSettings = this.pyStructSettings
            } else {
                storageSettings.pyStructSettings = this.structSettings
                storageSettings.jsStructSettings = this.jsStructSettings
            }

            window.localStorage.setItem(SETTINGS_VERSION, JSON.stringify(storageSettings))
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


        if (this.unconfigurables.has(structType)) return

        if (!(structType in this.structSettings)) {
            this.structSettings[structType] = {
                order: {},
                main: 'value',
                numChildren: null,
                pointers: {},
                color: randomColor(),
                textColor: this.configColors["Primary Background"]
            }
        }

    }
    @action setColor(structType: string, color?: string) {
        if (!color) {
            color = randomColor()
        }
        this.structSettings[structType].color = color
        this.structSettings[structType].textColor = this.configColors["Primary Background"]
    }
    @action deleteStruct(structType: string) {
        delete this.structSettings[structType]
    }
}

export default Settings
