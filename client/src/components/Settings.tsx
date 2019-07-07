import React from 'react';
import { observer } from 'mobx-react';
import store from '../store';
import StructSettings from './StructSettings';


type State = {
    adding: null | string
    details: {
        [key: string]: {
            position: number
        }
    }
}

@observer
class Settings extends React.Component {
    state: State = {
        adding: '',
        details: {}
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
            <div className={`modal ${store.settings.editing && 'is-active'}`}>
                <div className="modal-background" onClick={() => store.settings.stopEdit()}></div>
                <div className="modal-card">
                    <header className="modal-card-head">
                        <p className="modal-card-title">Settings</p>
                        <button onClick={() => store.settings.stopEdit()} className="delete" aria-label="close"></button>
                    </header>
                    <section className="modal-card-body">
                        Structure Settings
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
                    </section>
                    <footer className="modal-card-foot">
                        <button className="button is-success">Save changes</button>
                        <button onClick={() => store.settings.stopEdit()} className="button">Cancel</button>
                    </footer>
                </div>
            </div>
        );
    }
}

export default Settings;
