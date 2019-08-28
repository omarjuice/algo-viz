import React, { useState } from 'react';
import store from '../store';
import { observer } from 'mobx-react';
import Slider from 'rc-slider'
import SlowArrow from './icons/SlowArrow';
import FastArrow from './icons/FastArrow';

const Navbar: React.FC = observer(() => {
    const { iterator } = store
    const [type, setType] = useState('DECLARATION')

    return (
        <div>
            <nav className="navbar has-background-dark" role="navigation" aria-label="main navigation">
                <div className="navbar-brand">
                    {!store.editor.active && store.ready && (
                        <>
                            <div className="navbar-item">
                                <button
                                    className="button is-small"
                                    onClick={() => iterator.iterating ? iterator.pause() : iterator.play()}
                                >
                                    {<figure style={{ marginTop: '-3px' }} className="image is-4by4">
                                        <img src={process.env.PUBLIC_URL + (iterator.iterating ? '/baseline-pause-24px.svg' : '/baseline-play_arrow-24px.svg')} alt="" />
                                    </figure>}
                                </button>
                            </div>
                            <div className="navbar-item">
                                <button
                                    className="button is-small "
                                    onClick={() => iterator.iterating ? iterator.slower() : iterator.exec(false)}
                                    disabled={iterator.iterating ? store.iterator.speed === store.iterator.minSpeed : store.iterator.index <= 0}
                                >
                                    {iterator.iterating ?
                                        < SlowArrow />
                                        :
                                        <figure style={{ marginTop: '-3px' }} className="image is-4by4">
                                            <img src={process.env.PUBLIC_URL + '/baseline-skip_previous-24px.svg'} alt="" />
                                        </figure>
                                    }
                                </button>
                            </div>
                            <div className="navbar-item ">
                                <button
                                    className="button is-small "
                                    onClick={() => iterator.iterating ? iterator.faster() : iterator.exec(true)}
                                    disabled={iterator.iterating ? store.iterator.speed === store.iterator.maxSpeed : store.iterator.index >= store.viz.steps.length - 1}
                                >
                                    {iterator.iterating ?
                                        < FastArrow />
                                        :
                                        <figure style={{ marginTop: '-3px' }} className="image is-4by4">
                                            <img src={process.env.PUBLIC_URL + '/baseline-skip_next-24px.svg'} alt="" />
                                        </figure>
                                    }
                                </button>
                            </div>
                        </>
                    )}
                    {store.editor.active && (
                        <>
                            <div className="navbar-item ">
                                <button
                                    onClick={() => store.editor.submit()}
                                    className={`button is-primary ${store.api.loading && 'is-loading'}`}
                                    disabled={store.api.loading}
                                >Run</button>

                            </div>

                        </>
                    )}

                    {!store.api.loading &&
                        <div className="navbar-item">
                            {!store.editor.active ? (
                                <button onClick={() => {
                                    store.editor.toggle()
                                }} className={`button is-small`}>
                                    <figure style={{ marginTop: '-3px' }} className="image is-4by4">
                                        <img src={process.env.PUBLIC_URL + '/baseline-code-24px.svg'} alt="" />
                                    </figure>

                                </button>
                            ) : (
                                    <button onClick={() => {
                                        store.editor.toggle()
                                    }} className="delete" />

                                )}
                        </div>
                    }


                </div>
                <a role="button" href="#/" className="navbar-burger burger has-text-white" aria-label="menu" aria-expanded="false" data-target="navbarBasicExample">
                    <span aria-hidden="true"></span>
                    <span aria-hidden="true"></span>
                    <span aria-hidden="true"></span>
                </a>

                <div id="navbarBasicExample" className="navbar-menu">
                    <div className="navbar-start">
                        {!store.editor.active &&
                            (<>
                                <div className="navbar-item has-dropdown is-hoverable has-background-light">
                                    <a href="#/" className="navbar-link">
                                        <figure style={{ marginTop: '2px' }} className="image is-32x32">
                                            <img height={30} width={30} src={process.env.PUBLIC_URL + '/tachometer-alt-solid.svg'} alt="" />
                                        </figure>
                                    </a>
                                    <div className="navbar-dropdown has-background-dark">
                                        <div className="select">
                                            <select className="select has-background-dark has-text-white" value={type} onChange={(e) => setType(e.target.value)}>
                                                {Object.keys(store.settings.speeds).map(type => {
                                                    return <option key={type} value={type}>{type}</option>
                                                })}
                                            </select>
                                        </div>
                                        <Slider
                                            min={0}
                                            max={10}
                                            value={store.settings.speeds[type as Viz.configurable] || 0}
                                            onChange={(v) => { store.settings.changeSpeed(type, v) }}
                                        />
                                    </div>

                                </div>
                            </>)
                        }
                    </div>


                    <div className="navbar-end">
                        <div className="navbar-item">
                            <button onClick={() => store.startTutorial()} className="button is-warning is-small">
                                <figure style={{ marginTop: '-3px' }} className="image is-4by4">
                                    <img src={process.env.PUBLIC_URL + '/info.svg'} alt="" />
                                </figure>
                            </button>
                        </div>
                        <div className="navbar-item">
                            <button onClick={() => store.api.startPostingIssue()} className="button is-danger is-small">
                                <figure style={{ marginTop: '-3px' }} className="image is-4by4">
                                    <img src={process.env.PUBLIC_URL + '/bug-24px.svg'} alt="" />
                                </figure>
                            </button>
                        </div>
                        <div className="navbar-item">
                            <button onClick={() => store.settings.startEdit()} className="button is-link is-small">
                                <figure style={{ marginTop: '-1.5px' }} className="image is-4by4">
                                    <img src={process.env.PUBLIC_URL + '/baseline-settings-20px.svg'} alt="" />
                                </figure>
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

        </div >
    );
}
)
export default Navbar;
