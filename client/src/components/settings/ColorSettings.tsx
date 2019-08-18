import React, { Component } from 'react';
import { observer } from 'mobx-react';
import store from '../../store';
import { ColorResult, SketchPicker } from 'react-color'
@observer
class ColorSettings extends Component {
    state = {
        active: ''
    }
    handleClick = (name: string) => {
        this.setState({ active: this.state.active === name ? '' : name })
    }
    render() {
        const colors = store.settings.valueColors
        const defaults = store.settings.valueColorDefaults
        const configColors = store.settings.configColors
        return (
            <div style={{ backgroundColor: configColors['Background'] }} className="color-settings-panel">
                {Object.keys(colors).map((n) => {
                    const name = n as Viz.valueColor
                    if (name === 'other') return null;
                    return (
                        <>
                            <div className="columns is-multiline" style={{ color: configColors['Text'], backgroundColor: configColors['Background'] }}>
                                <div className="column is-one-third has-text-left">
                                    {name}
                                </div>
                                <div className="column is-one-third has-text-centered">
                                    <button
                                        style={{ backgroundColor: defaults[name], color: configColors['Background'] }}
                                        onClick={() => colors[name] = store.settings.valueColorDefaults[name]}
                                        className="button is-small has-text-weight-bold">
                                        Default
                                        </button>
                                </div>
                                <div className="column is-one-third has-text-right">
                                    <button onClick={() => this.handleClick(name)}
                                        style={{ backgroundColor: colors[name] }} className="button">
                                        <figure className="image is-4by4">
                                            <img src={process.env.PUBLIC_URL + '/baseline-brush-24px.svg'} alt="" />
                                        </figure>
                                    </button>
                                </div>

                                {this.state.active === name && (
                                    <>
                                        <div className="column is-one-third"></div>
                                        <div className="column is-one-third has-text-centered">
                                            <SketchPicker
                                                onChange={(color: ColorResult) => colors[name] = color.hex}
                                                color={colors[name]}
                                            />
                                        </div>
                                        <div className="column is-one-third"></div>
                                    </>
                                )}
                            </div>
                            <hr />
                        </>
                    )
                })}
            </div>
        );
    }
}

export default ColorSettings;
