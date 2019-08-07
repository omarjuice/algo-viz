import React, { Component } from 'react';
import { observer } from 'mobx-react';
import store from '../store';
import DraggableList from './DraggableList'

type Props = {
    name: string
}
type State = {
    editing: boolean
    newKeyName: string
    newPointerName: string
    order: { [key: string]: Viz.order }
    main: string
    numChildren: number
    numKeys: number
    pointers: { [key: string]: boolean }
}
type childType = 'child' | 'children'
type pointerType = 'single' | 'multiple'

@observer
class StructSettings extends Component<Props> {
    state: State = {
        editing: false,
        newKeyName: '',
        newPointerName: '',
        order: {},
        main: '',
        numChildren: null,
        numKeys: 0,
        pointers: {}
    }
    componentDidMount() {
        const struct = store.settings.structSettings[this.props.name]
        this.setState({
            order: { ...struct.order },
            main: struct.main,
            numChildren: struct.numChildren || null,
            numKeys: Object.keys(struct.order).length,
            pointers: { ...struct.pointers }
        })
    }
    addKey = () => {
        const newKey = this.state.newKeyName
        if (newKey) {
            let pointers = this.state.pointers
            if (newKey in pointers) {
                pointers = { ...pointers }
                delete pointers[newKey]
            }
            this.setState({
                order: {
                    ...this.state.order, [newKey]: {
                        pos: this.state.numKeys + 1,
                        isMultiple: null
                    }
                },
                newKeyName: '',
                numKeys: this.state.numKeys + 1,
                pointers
            })
        }
    }
    removeKey = (name: string) => {
        const { order } = this.state
        const newKeys = { ...order }
        delete newKeys[name]
        this.setState({ order: newKeys, numKeys: this.state.numKeys - 1 })
    }
    changePos = (name: string, pos: number) => {
        const { order } = this.state
        const newKeys = { ...order }
        newKeys[name].pos = Math.max(1, Math.min(pos, this.state.numKeys))
        this.setState({
            order: newKeys
        })
    }
    changeType = (name: string, type: childType) => {
        const { order } = this.state
        const newKeys = { ...order }
        newKeys[name].isMultiple = type === 'children'
        this.setState({ order: newKeys })
    }
    addPointer = () => {
        const newPointer = this.state.newPointerName
        if (newPointer) {
            let order = this.state.order
            if (newPointer in order) {
                order = { ...order }
                delete order[newPointer]
            }
            this.setState({
                pointers: {
                    ...this.state.pointers, [newPointer]: false
                },
                newPointerName: '',
                order
            })
        }
    }
    removePointer = (name: string) => {
        const { pointers } = this.state
        const newPointers = { ...pointers }
        delete newPointers[name]
        this.setState({
            pointers: newPointers
        })
    }
    configPointer = (name: string, type: pointerType) => {
        const { pointers } = this.state
        const newPointers = { ...pointers }
        newPointers[name] = type === 'multiple'
        this.setState({
            pointers: newPointers
        })
    }
    changeMain(name: string) {
        this.setState({
            main: name
        })
    }
    submit = () => {
        const { order, main, numChildren, pointers } = this.state
        const struct = store.settings.structSettings[this.props.name]
        struct.order = order
        struct.main = main
        struct.numChildren = numChildren
        struct.pointers = pointers
        this.setState({
            editing: false
        })
    }
    toggleNumChildren() {
        this.setState({
            numChildren: this.state.numChildren === null ? 1 : null
        })

    }
    render() {
        const { name } = this.props
        const { settings } = store
        const { structColors } = settings
        const style: React.CSSProperties = {
            border: `5px solid ${structColors[name]}`,
            color: "white",

        }
        const keys = Object.keys(this.state.order)
        const pointers = Object.keys(this.state.pointers)
        const specifiedChildren = this.state.numChildren !== null
        const isBuiltin = /Viz\./g.test(name) || ['Array', 'Object', 'Set', 'Map'].includes(name)
        return (
            <div className="box has-background-dark" style={style}>

                <div className="columns">
                    <div className="column has-text-left">
                        <h1 className="title is-5 has-text-weight-bold">{name}</h1>
                    </div>
                    <div className="column">
                        {!isBuiltin && <button onClick={() => this.setState({ editing: !this.state.editing })} className="button is-small">
                            {this.state.editing ? 'Cancel' : 'Edit'}
                        </button>}
                    </div>
                    <div className="column has-text-centered">
                        <input type="color" value={structColors[name]} onChange={(e) => structColors[name] = e.target.value} />
                    </div>
                    <div className="column has-text-right">
                        {!isBuiltin && <button className="delete" onClick={() => settings.deleteStruct(name)}></button>}
                    </div>
                </div>
                {this.state.editing && (
                    <div>
                        <h1 className="title is-5">
                            Children
                        </h1>
                        <DraggableList changeType={this.changeType} removeKey={this.removeKey} items={keys.map(key => ({ ...this.state.order[key], key }))} />

                        <hr />
                        <div className="columns">
                            <div className="column">
                                <input type="text" className="input" onChange={(e) => this.setState({ newKeyName: e.target.value })} value={this.state.newKeyName} />
                            </div>
                            <div className="column has-text-right">
                                <button className="button is-primary" disabled={!this.state.newKeyName} onClick={this.addKey}>Add Child</button>
                            </div>
                        </div>
                        <h1 className="title is-5">
                            Pointers
                        </h1>
                        <ul className="list">
                            {pointers.map(key => {
                                return (
                                    <li key={key} className="list-item">
                                        <div className="columns ">
                                            <div className="column">
                                                <select onChange={(e) => this.configPointer(key, e.target.value as pointerType)}
                                                    value={this.state.pointers[key] ? "multiple" : "single"} className="select">
                                                    <option value={'single'}>single</option>
                                                    <option value={'multiple'}>multiple</option>
                                                </select>
                                            </div>
                                            <div className="column has-text-centered">
                                                {key}
                                            </div>
                                            <div className="column has-text-right">
                                                <button className="delete" onClick={() => this.removePointer(key)} />
                                            </div>
                                        </div>
                                    </li>
                                )
                            })}
                        </ul>
                        <hr />
                        <div className="columns">
                            <div className="column">
                                <input type="text" className="input" onChange={(e) => this.setState({ newPointerName: e.target.value })} value={this.state.newPointerName} />
                            </div>
                            <div className="column has-text-right">
                                <button className="button is-primary" disabled={!this.state.newPointerName} onClick={this.addPointer}>Add Pointer</button>
                            </div>
                        </div>
                        <div>
                            <h1 className="title is-5">
                                Main Value
                            </h1>
                            <input className="input" type="text" value={this.state.main} onChange={(e) => this.changeMain(e.target.value)} />
                        </div>
                        <div>
                            <h1 className="title is-5">
                                Potential Number of Chilren
                            </h1>
                            <button onClick={() => this.toggleNumChildren()} className="button is-text has-text-white is-dark">
                                {!specifiedChildren ? 'Specify Potential Number of Children' : 'Unspecify Number of Chilren'}
                            </button>
                            {specifiedChildren && (
                                <input className="input" type="number" min={1} max={1000} value={this.state.numChildren} onChange={(e) => {
                                    this.setState({
                                        numChildren: Number(e.target.value)
                                    })
                                }} />
                            )}
                        </div>
                        <div className="has-text-centered">
                            <button onClick={this.submit} className="button is-link">
                                Finished Editing {name}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        );
    }
}

export default StructSettings;
