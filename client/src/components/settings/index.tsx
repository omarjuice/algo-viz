import React from 'react';
import { observer } from 'mobx-react';
import store from '../../store';
import StructSettingsPanel from './StructSettingsPanel';
import ConfigSettings from './ConfigSettings';

type panelType = 'Config' | 'Structure Settings' | 'Colors'
type State = {
    panel: panelType
}

@observer
class Settings extends React.Component {
    state: State = {
        panel: 'Config'
    }
    panelNames: panelType[] = ['Colors', 'Config', 'Structure Settings']
    panelComponents: { [key in panelType]: React.ReactNode } = {
        Colors: <div></div>,
        Config: <ConfigSettings />,
        "Structure Settings": <StructSettingsPanel />
    }
    setPanel = (panel: panelType) => {
        this.setState({
            panel
        })
    }
    render() {
        return (
            <div className={`modal ${store.settings.editing && 'is-active'}`}>
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
                                            className={active && 'is-active'}>
                                            <a style={{ color: active ? store.settings.configColors['Code Highlight'] : store.settings.configColors['Code'] }}>{name}</a>
                                        </li>
                                    )
                                })
                            }
                        </ul>
                    </div>

                    <section className="modal-card-body">
                        {this.panelComponents[this.state.panel]}
                    </section>

                </div>
            </div>
        );
    }
}

export default Settings;
