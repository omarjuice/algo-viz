import React, { useState } from 'react';
import store from '../store';
import { observer } from 'mobx-react';

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
                                    {iterator.iterating ? 'Pause' : 'Play'}
                                </button>
                            </div>
                            <div className="navbar-item">
                                <button
                                    className="button is-small"
                                    onClick={() => iterator.faster()}
                                >
                                    Faster
                            </button>
                            </div>
                            <div className="navbar-item is-small">
                                <button
                                    className="button is-small"
                                    onClick={() => iterator.slower()}
                                >
                                    Slower
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
                    <div className="navbar-item">
                        <button onClick={() => {
                            store.editor.active = !store.editor.active
                            store.api.error = null
                        }} className="button is-small">
                            {store.editor.active ? 'close' : 'code'}
                        </button>
                    </div>

                </div>
                <a role="button" href="#/" className="navbar-burger burger" aria-label="menu" aria-expanded="false" data-target="navbarBasicExample">
                    <span aria-hidden="true"></span>
                    <span aria-hidden="true"></span>
                    <span aria-hidden="true"></span>
                </a>

                <div id="navbarBasicExample" className="navbar-menu">
                    <div className="navbar-start">
                        <div className="navbar-item has-dropdown is-hoverable has-background-dark">
                            <a href="#/" className="navbar-link">
                                Adjust Speeds
                            </a>
                            <div className="navbar-dropdown has-background-dark s">
                                <div className="select">
                                    <select className="select" value={type} onChange={(e) => setType(e.target.value)}>
                                        {Object.keys(store.settings.speeds).map(type => {
                                            return <option key={type} value={type}>{type}</option>
                                        })}
                                    </select>
                                </div>
                                <input value={store.settings.speeds[type as Viz.configurable] || 0} type="number" min={0} step={1} onChange={(e) => {
                                    store.settings.changeSpeed(type, e.target.value)
                                }} />
                            </div>

                        </div>
                    </div>

                    <div className="navbar-end">

                        {/* <div className="navbar-item">
                            <button onClick={() => store.settings.startEdit()} className="button is-link is-small">
                                Settings
                          </button>
                        </div> */}
                    </div>
                </div>
            </nav>

        </div >
    );
}
)
export default Navbar;
