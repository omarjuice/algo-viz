import React, { useState } from 'react';
import store from '../store';
import { observer } from 'mobx-react';
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
                            <div className="navbar-item ">
                                <button
                                    className="button is-small "
                                    onClick={() => iterator.faster()}
                                    disabled={store.iterator.speed === store.iterator.maxSpeed}
                                >
                                    <FastArrow />
                                </button>
                            </div>
                            <div className="navbar-item">
                                <button
                                    className="button is-small "
                                    onClick={() => iterator.slower()}
                                    disabled={store.iterator.speed === store.iterator.minSpeed}
                                >
                                    < SlowArrow />
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
                    {/* <div className="navbar-item">
                        <button onClick={() => {
                            store.editor.active = !store.editor.active
                            store.api.error = null
                        }} className={`button is-small ${store.editor.active && 'is-text'}`}>
                            {store.editor.active ?
                                <a href="#/" className='delete'></a> :
                                <figure style={{ marginTop: '-3px' }} className="image is-4by4">
                                    <img src={process.env.PUBLIC_URL + '/baseline-code-24px.svg'} alt="" />
                                </figure>}

                        </button>
                    </div> */}
                    <div className="navbar-item">
                        {!store.editor.active ? (
                            <button onClick={() => {
                                store.editor.active = !store.editor.active
                                store.api.error = null
                            }} className={`button is-small`}>
                                <figure style={{ marginTop: '-3px' }} className="image is-4by4">
                                    <img src={process.env.PUBLIC_URL + '/baseline-code-24px.svg'} alt="" />
                                </figure>

                            </button>
                        ) : (
                                <button onClick={() => {
                                    store.editor.active = !store.editor.active
                                    store.api.error = null
                                }} className="delete" />

                            )}
                    </div>


                </div>
                <a role="button" href="#/" className="navbar-burger burger" aria-label="menu" aria-expanded="false" data-target="navbarBasicExample">
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
                                        <figure style={{ marginTop: '2px' }} className="image is-4by4">
                                            <img height={30} width={30} src={process.env.PUBLIC_URL + '/tachometer-alt-solid.svg'} alt="" />
                                        </figure>
                                    </a>
                                    <div className="navbar-dropdown has-background-dark">
                                        <div className="select">
                                            <select className="select" value={type} onChange={(e) => setType(e.target.value)}>
                                                {Object.keys(store.settings.speeds).map(type => {
                                                    return <option key={type} value={type}>{type}</option>
                                                })}
                                            </select>
                                        </div>
                                        <input className="input" value={store.settings.speeds[type as Viz.configurable] || 0} type="number" min={0} step={1} onChange={(e) => {
                                            store.settings.changeSpeed(type, e.target.value)
                                        }} />
                                    </div>

                                </div>
                            </>)
                        }
                    </div>


                    <div className="navbar-end">

                        <div className="navbar-item">
                            <button onClick={() => store.settings.startEdit()} className="button is-link is-small">
                                <figure style={{ marginTop: '-2px' }} className="image is-4by4">
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
