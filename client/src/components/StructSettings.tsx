import React, { Component } from 'react';
import { observer } from 'mobx-react';
import store from '../store';
import invertColor from '../utils/invertColor';


type Props = {
    name: string
}
type State = {
    editing: boolean
    newKeyName: string
    order: {
        [name: string]: {
            pos: number
            isMultiple: boolean// alpha & numeric ordering

        }
    },
    main: string
    numChildren: number
}
type childType = 'child' | 'children'
@observer
class StructSettings extends Component<Props> {
    state: State = {
        editing: false,
        newKeyName: '',
        order: {},
        main: '',
        numChildren: null
    }
    componentDidMount() {
        const struct = store.settings.structSettings[this.props.name]
        this.setState({
            order: struct.order,
            main: struct.main,
            numChildren: struct.numChildren || null
        })
    }
    addKey = () => {
        if (this.state.newKeyName) {
            this.setState({
                order: {
                    ...this.state.order, [this.state.newKeyName]: {
                        pos: Infinity,
                        isMultiple: null
                    }
                },
                newKeyName: ''
            })
        }
    }
    removeKey = (name: string) => {
        const { order } = this.state
        const newKeys = { ...order }
        delete newKeys[name]
        this.setState({ keys: newKeys })
    }
    changePos = (name: string, pos: string) => {
        const { order } = this.state
        const newKeys = { ...order }
        newKeys[name].pos = Number(pos)
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
    changeMain(name: string) {
        this.setState({
            main: name
        })
    }
    submit = () => {
        const { order, main, numChildren } = this.state
        const struct = store.settings.structSettings[this.props.name]
        struct.order = order
        struct.main = main
        struct.numChildren = numChildren
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
            backgroundColor: structColors[name],
            color: invertColor(structColors[name])
        }
        const keys = Object.keys(this.state.order)
        const numKeys = keys.length
        const specifiedChildren = this.state.numChildren !== null
        return (
            <div className="box" style={style}>

                <div className="columns">
                    <div className="column has-text-left">
                        <h1 className="title is-5 has-text-weight-bold">{name}</h1>
                    </div>
                    <div className="column">
                        <button onClick={() => this.setState({ editing: !this.state.editing })} className="button is-small">
                            {this.state.editing ? 'Cancel' : 'Edit'}
                        </button>
                    </div>
                    <div className="column has-text-centered">
                        <input type="color" value={structColors[name]} onChange={(e) => structColors[name] = e.target.value} />
                    </div>
                    <div className="column has-text-right">
                        <button className="delete" onClick={() => settings.deleteStruct(name)}></button>
                    </div>
                </div>
                {this.state.editing && (
                    <div>
                        <h1 className="title is-5">
                            Children
                        </h1>
                        <ul className="list">
                            {keys.map(key => {
                                return (
                                    <li key={key} className="list-item">
                                        <div className="columns">
                                            <div className="column">
                                                <select onChange={(e) => this.changeType(key, e.target.value as childType)}
                                                    value={this.state.order[key].isMultiple ? "children" : 'child'} className="select">
                                                    <option value={'child'}>child</option>
                                                    <option value={'children'}>children</option>
                                                </select>
                                            </div>
                                            <div className="column has-text-centered">
                                                {key}
                                            </div>
                                            <div className="column has-text-centered">
                                                <input type="number" min={1} onChange={(e) => this.changePos(key, e.target.value)}
                                                    value={Math.max(Math.min(this.state.order[key].pos, numKeys), 1)} className="input" />
                                            </div>
                                            {/* {this.state.keys[key].isMultiple && (
                                                <div className="column has-text-centered">
                                                    {this.state.keys[key].isMultiple}
                                                </div>
                                            )} */}
                                            <div className="column has-text-right">
                                                <button className="delete" onClick={() => this.removeKey(key)} />
                                            </div>
                                        </div>
                                    </li>
                                )
                            })}
                        </ul>
                        <hr />
                        <div className="columns">
                            <div className="column">
                                <input type="text" className="input" onChange={(e) => this.setState({ newKeyName: e.target.value })} value={this.state.newKeyName} />
                            </div>
                            <div className="column has-text-right">
                                <button className="button is-primary" disabled={!this.state.newKeyName} onClick={this.addKey}>Add Child</button>
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
                            <button onClick={() => this.toggleNumChildren()} className="button is-text">
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
