import { observable, action } from "mobx";

type colors = {
    special: string
    number: string
    string: string
    boolean: string
    other: string
}

type speeds = {
    DECLARATION: number,
    ASSIGNMENT: number,
    EXPRESSION: number,
    METHODCALL: number,
    CALL: number,
    DELETE: number,
    METHOD: number,
    RETURN: number,
    BLOCK: number,
    FUNC: number,
    PROGRAM: number,
    GET: number,
    SET: number,
    CLEAR: number,
}

interface AllSettings {
    colors: colors
    background: string
    speeds: speeds
}




class Settings {
    @observable colors = {
        special: '#255e4f',
        number: 'steelblue',
        string: 'yellow',
        boolean: 'green',
        other: 'white'
    }
    @observable background = '#0b1423'
    @observable speeds: { [key: string]: number } = {
        DECLARATION: 5,
        ASSIGNMENT: 5,
        EXPRESSION: 5,
        METHODCALL: 5,
        CALL: 5,
        DELETE: 3,
        GET: 3,
        SET: 3,
    }
    @observable editing: boolean = false
    constructor() {
        const settings = window.localStorage.getItem('settings')
        if (settings) {
            const all: AllSettings = JSON.parse(settings)
            this.background = all.background
            this.colors = all.colors
            this.speeds = all.speeds
        }
    }
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
                this.speeds[type] = val
            }
        }
    }
}

export default Settings