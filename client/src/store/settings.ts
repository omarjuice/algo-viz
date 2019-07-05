import { observable, action } from "mobx";

type colors = {
    special: string
    number: string
    string: string
    boolean: string
    other: string
}

type speeds = {
    [key in Viz.configurable]: number;
};
type objectColors = {
    [key: string]: string
}



interface AllSettings {
    valueColors: colors
    background: string
    speeds: speeds
    objectColors: objectColors
}




class Settings implements AllSettings {
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
        METHODCALL: 5,
        CALL: 5,
        DELETE: 3,
        GET: 3,
        SET: 3,
        CLEAR: 3
    }
    @observable editing: boolean = false
    @observable objectColors = {
        'Array': 'whitesmoke',
        'Object': 'fuchsia'
    }

    // constructor() {
    //     // const settings = window.localStorage.getItem('settings')
    //     // if (settings) {
    //     //     const all: AllSettings = JSON.parse(settings)
    //     //     this.background = all.background
    //     //     this.valueColors = all.valueColors
    //     //     this.speeds = all.speeds
    //     // }
    //     window.localStorage.setItem('settings', JSON.stringify(this))
    // }
    @action startEdit() {
        this.editing = true
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
}

export default Settings