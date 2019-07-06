import React, { Component } from 'react';
import { observer } from 'mobx-react';
import store from '../store';
import invertColor from '../utils/invertColor';


type Props = {
    name: string
}
type State = {
    color: string
}
@observer
class StructSettings extends Component<Props> {
    state: State = {
        color: 'white'
    }
    componentDidMount() {
        this.setState({
            color: store.settings.structColors[this.props.name]
        })
    }
    render() {
        const { name } = this.props
        const { settings } = store
        const { structColors, structSettings } = settings
        const style: React.CSSProperties = {
            backgroundColor: structColors[name],
            color: invertColor(structColors[name])
        }
        return (
            <div className="box" style={style}>

                <div className="columns">
                    <div className="column has-text-left">
                        <h1 className="title is-5">{name}</h1>
                    </div>
                    <div className="column">

                    </div>
                    <div className="column has-text-centered">
                        <input type="color" value={structColors[name]} onChange={(e) => structColors[name] = e.target.value} />
                    </div>
                    <div className="column has-text-right">
                        <button className="delete" onClick={() => settings.deleteStruct(name)}></button>
                    </div>

                </div>
            </div>
        );
    }
}

export default StructSettings;
