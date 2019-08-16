import React, { Component } from 'react';
import { observer } from 'mobx-react';
import store from '../../store';
import SwitchButton from './SwitchButton';

@observer
class ConfigSettings extends Component {

    render() {
        const config = store.settings.config
        return (
            <div>
                {Object.keys(store.settings.config).map((name) => {
                    const n = name as Viz.configTypes
                    return (
                        <div>
                            <div className="columns">
                                <div className="column has-text-white">
                                    {name}
                                </div>
                                <div className="column">
                                    <SwitchButton onClick={() => config[n] = !config[n]} size={50} toggled={config[n]} />
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>
        );
    }
}

export default ConfigSettings;
