import React, { Component, ReactNode } from 'react';
import { observer } from 'mobx-react';
import store from '../../store';
import DraggableList from './DraggableList'
import Slider from 'rc-slider'
import { structInfo } from '../../store/settings';
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
    pointers: { [key: string]: boolean },
    deleting: boolean
}
type childType = 'single' | 'multiple'
type pointerType = childType

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
        pointers: {},
        deleting: false
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
    updatePositions = (items: string[]) => {
        const { order } = this.state
        const newKeys = { ...order }
        items.forEach((k, i) => newKeys[k].pos = Math.max(1, Math.min(i + 1, this.state.numKeys)))
        this.setState({
            order: newKeys
        })
    }
    changeType = (name: string, type: childType) => {
        const { order } = this.state
        const newKeys = { ...order }
        newKeys[name].isMultiple = type === 'multiple'
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
    toggleDelete = (bool: boolean) => {
        this.setState({
            deleting: bool
        })
    }
    render() {
        const { name } = this.props
        const { settings } = store

        const structSettings = settings.structSettings[name]



        const style: React.CSSProperties = {
            border: `5px solid ${structSettings.color}`,
            backgroundColor: store.settings.configColors['Secondary Background'],
            color: store.settings.configColors['Text']
        }
        const keys = Object.keys(this.state.order)
        const pointers = Object.keys(this.state.pointers)
        const isBuiltin = /Viz\./g.test(name);
        const isNative = ['Array', 'Object', 'Set', 'Map'].includes(name)
        return (
            <div className="box" style={style}>

                <div className="columns">
                    <div className="column has-text-left">
                        <h1 className="title is-6" style={{ color: store.settings.configColors["Text"] }}>{name}</h1>
                    </div>
                    <div className="column has-text-centered">
                        {!isNative && <button onClick={() => this.setState({ editing: !this.state.editing, deleting: false })} className="button is-small has-text-weight-bold">
                            {this.state.editing ? 'Cancel' : 'Edit'}
                        </button>}
                    </div>
                    <div className="column has-text-centered">
                        <input type="color" value={structSettings.color} onChange={(e) => structSettings.color = e.target.value} />
                    </div>
                    {!isNative && <div className="column has-text-centered">
                        <input type="color" value={structSettings.textColor} onChange={(e) => structSettings.textColor = e.target.value} />
                    </div>}
                    <div className="column has-text-right">
                        {!isNative && !isBuiltin && (
                            this.state.deleting ?
                                <div className="columns">
                                    <div className="column is-one-third">
                                        Sure?
                                    </div>
                                    <div className="column is-one-third">
                                        <button onClick={() => settings.deleteStruct(name)} className="button is-small">
                                            Yes
                                        </button>
                                    </div>
                                    <div className="column is-one-third">
                                        <button onClick={() => this.toggleDelete(false)} className="button is-small">
                                            No
                                        </button>
                                    </div>


                                </div>
                                : <button className="delete" onClick={() => this.toggleDelete(true)}></button>
                        )}
                    </div>
                </div>
                {this.state.editing && (
                    <div>
                        <h1 className="title is-6" style={{ color: store.settings.configColors["Text"] }}>
                            Children
                        </h1>
                        <DraggableList
                            isConfigurable={!isBuiltin}
                            updatePositions={this.updatePositions}
                            changeType={this.changeType}
                            removeKey={this.removeKey}
                            items={
                                keys
                                    .map(key => ({ ...this.state.order[key], key }))
                                    .sort((a, b) => a.pos - b.pos)
                            } />


                        {!isBuiltin && <div className="columns">
                            <div className="column">
                                <input type="text" className="input" onChange={(e) => this.setState({ newKeyName: e.target.value })} value={this.state.newKeyName} />
                            </div>
                            <div className="column has-text-right">
                                <button className="button is-primary" disabled={!this.state.newKeyName} onClick={this.addKey}>Add Child</button>
                            </div>
                        </div>}
                        <hr />
                        <h1 className="title is-6" style={{ color: store.settings.configColors["Text"] }}>
                            Pointers
                        </h1>
                        <ul className="list">
                            {pointers.map(key => {
                                const configurable = isBuiltin ? !(key in structInfo[name].pointers) : true
                                return (
                                    <li key={key} className="list-item">
                                        <div className="columns ">
                                            <div className="column">
                                                <select onChange={configurable ? (e) => this.configPointer(key, e.target.value as pointerType) : undefined}
                                                    value={this.state.pointers[key] ? "multiple" : "single"} className="select">
                                                    <option value={'single'}>single</option>
                                                    <option value={'multiple'}>multiple</option>
                                                </select>
                                            </div>
                                            <div className="column has-text-centered">
                                                {key}
                                            </div>
                                            {configurable && <div className="column has-text-right">
                                                <button className="delete" onClick={() => this.removePointer(key)} />
                                            </div>}
                                        </div>
                                    </li>
                                )
                            })}
                        </ul>

                        <div className="columns">
                            <div className="column">
                                <input type="text" className="input" onChange={(e) => this.setState({ newPointerName: e.target.value })} value={this.state.newPointerName} />
                            </div>
                            <div className="column has-text-right">
                                <button className="button is-primary" disabled={!this.state.newPointerName} onClick={this.addPointer}>Add Pointer</button>
                            </div>
                        </div>
                        <hr />
                        <div>
                            <h1 className="title is-6" style={{ color: store.settings.configColors["Text"] }}>
                                Display Key
                            </h1>
                            <input className="input" type="text" value={this.state.main} onChange={isBuiltin ? undefined : (e) => this.changeMain(e.target.value)} />
                        </div>
                        <hr />
                        <div>
                            <h1 className="title is-6" style={{ color: store.settings.configColors["Text"] }}>
                                Number of Children
                            </h1>

                            <Slider
                                min={0}
                                max={12}
                                marks={
                                    new Array(13).fill(1).reduce((a, _, i) => {
                                        if (i === 0) {
                                            a[i] = <span style={{ textOrientation: 'sideways', writingMode: 'vertical-rl', color: 'white', fontSize: 9 }}>unspecified</span>
                                        } else {
                                            a[i] = String(i)
                                        }
                                        return a
                                    }, {} as { [key: string]: ReactNode })
                                }
                                value={Number(this.state.numChildren)}
                                onChange={isBuiltin ? undefined : (v) => v === 0 ? this.toggleNumChildren() : this.setState({ numChildren: v })}
                                trackStyle={{
                                    backgroundColor: settings.configColors['Step Slider Track'],
                                    height: 5
                                }}
                                railStyle={{
                                    backgroundColor: settings.configColors['Step Slider Rail'],
                                    height: 5
                                }}
                            />
                        </div>
                        <br />
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
