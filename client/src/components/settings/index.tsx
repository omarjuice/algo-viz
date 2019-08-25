import React from 'react';
import { observer } from 'mobx-react';
import store from '../../store';
import StructSettingsPanel from './StructSettingsPanel';
import ConfigSettings from './ConfigSettings';
import ColorSettings from './ColorSettings'
import Language from './Language';
type panelType = 'Config' | 'Structure Settings' | 'Colors' | 'Language'
type State = {
    panel: panelType
}

@observer
class Settings extends React.Component {
    state: State = {
        panel: 'Config'
    }
    panelNames: panelType[] = ['Colors', 'Config', 'Structure Settings', 'Language']
    panelComponents: { [key in panelType]: React.ReactNode } = {
        Colors: <ColorSettings />,
        Config: <ConfigSettings />,
        "Structure Settings": <StructSettingsPanel />,
        "Language": <Language />
    }
    setPanel = (panel: panelType) => {
        this.setState({
            panel
        })
    }
    render() {
        return (
            <div className={`modal ${store.settings.editing && 'is-active'}`} >
                <div className="modal-background" onClick={() => store.settings.stopEdit()}></div>
                <div className="modal-card" style={{ backgroundColor: store.settings.configColors['Background'] }}>
                    <header style={{ backgroundColor: store.settings.configColors['Navbar'] }} className="modal-card-head">
                        <p className="modal-card-title">Settings</p>
                        <button onClick={() => store.settings.stopEdit()} className="delete" aria-label="close"></button>
                    </header>

                    <div className="settings-tabs tabs">
                        <ul>
                            {
                                this.panelNames.map(name => {
                                    const active = this.state.panel === name
                                    return (
                                        <li key={name} onClick={() => this.setPanel(name)}
                                            className={active ? 'is-active' : ''}>
                                            <a href="#/" style={{ color: active ? store.settings.configColors['Code Highlight'] : store.settings.configColors['Code'] }}>{name}</a>
                                        </li>
                                    )
                                })
                            }
                        </ul>
                    </div>

                    <section className="modal-card-body" style={{ transition: 'height 500ms' }}>
                        {this.panelComponents[this.state.panel]}
                    </section>

                </div>
            </div>
        );
    }
}

export default Settings;
