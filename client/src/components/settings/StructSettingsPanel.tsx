import React, { Component } from 'react';
import { observer } from 'mobx-react';
import store from '../../store';
import StructSettings from './StructSettings';




type State = {
    adding: null | string

}

@observer
class StructSettingsPanel extends Component {
    state: State = {
        adding: '',
    }
    handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        const { adding } = this.state
        if (!adding) return
        store.settings.addStruct(this.state.adding)
        this.setState({ adding: '' })
    }
    render() {
        return (
            <div className="struct-settings-panel">
                {Object.keys(store.settings.structSettings).map(name => {
                    return (
                        <StructSettings key={name} name={name} />
                    )
                })}
                <form className="form" onSubmit={this.handleSubmit}>
                    <div className="field">
                        <div className="control">
                            <input type="text" onChange={(e) => this.setState({ adding: e.target.value })} value={this.state.adding} className="input" />
                        </div>
                    </div>
                    <button className="button">Add</button>
                </form>
            </div>
        );
    }
}

export default StructSettingsPanel;
