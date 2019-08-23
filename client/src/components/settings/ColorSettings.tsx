import React, { Component } from 'react';
import { observer } from 'mobx-react';
import store from '../../store';
import { ColorResult, SketchPicker } from 'react-color'
@observer
class ColorSettings extends Component {
    state = {
        active: ''
    }
    skipSet: Set<string> = new Set(['Background', 'Text', 'Navbar', 'other'])
    handleClick = (name: string) => {
        this.setState({ active: this.state.active === name ? '' : name })
    }
    render() {

        const { valueColors, valueColorDefaults, configColors, configColorDefaults } = store.settings
        return (
            <div style={{ backgroundColor: configColors['Background'] }} className="color-settings-panel">
                {Object.keys(valueColors).map((n) => {
                    const name = n as Viz.valueColor
                    if (this.skipSet.has(name)) return null;
                    const [colors, defaults] = [valueColors, valueColorDefaults]

                    return (
                        <React.Fragment key={name}>
                            <div className="columns is-multiline" style={{ color: configColors['Text'], backgroundColor: configColors['Background'] }}>
                                <div className="column is-one-third has-text-left has-text-weight-bold">
                                    {name}
                                </div>
                                <div className="column is-one-third has-text-centered">
                                    <button
                                        style={{ backgroundColor: defaults[name], color: configColors['Background'] }}
                                        onClick={() => colors[name] = defaults[name]}
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
                        </React.Fragment>
                    )
                })}
                {Object.keys(configColors).map((n) => {
                    const name = n as Viz.configColor
                    if (this.skipSet.has(name)) return null;
                    const [colors, defaults] = [configColors, configColorDefaults]
                    console.log(name, colors[name]);
                    return (
                        <React.Fragment key={name}>
                            <div className="columns is-multiline" style={{ color: configColors['Text'], backgroundColor: configColors['Background'] }}>
                                <div className="column is-one-third has-text-left has-text-weight-bold">
                                    {name}
                                </div>
                                <div className="column is-one-third has-text-centered">
                                    <button
                                        style={{ backgroundColor: defaults[name], color: configColors['Background'] }}
                                        onClick={() => colors[name] = defaults[name]}
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
                        </React.Fragment>
                    )
                })}

            </div>
        );
    }
}

export default ColorSettings;
