import React from 'react';
import { observer } from 'mobx-react';
import store from '../store';

const Settings: React.FC = observer(() => {
    return (
        <div className={`modal ${store.settings.editing && 'is-active'}`}>
            <div className="modal-background" onClick={() => store.settings.stopEdit()}></div>
            <div className="modal-card">
                <header className="modal-card-head">
                    <p className="modal-card-title">Settings</p>
                    <button onClick={() => store.settings.stopEdit()} className="delete" aria-label="close"></button>
                </header>
                <section className="modal-card-body">
                    <form className="form">
                        <input type="number" className="input" />
                    </form>
                    <form className="form">
                        <input type="number" className="input" />
                    </form>
                    <form className="form">
                        <input type="number" className="input" />
                    </form>
                    <form className="form">
                        <input type="number" className="input" />
                    </form>
                    <form className="form">
                        <input type="number" className="input" />
                    </form>
                    <form className="form">
                        <input type="number" className="input" />
                    </form>
                    <form className="form">
                        <input type="number" className="input" />
                    </form>
                </section>
                <footer className="modal-card-foot">
                    <button className="button is-success">Save changes</button>
                    <button onClick={() => store.settings.stopEdit()} className="button">Cancel</button>
                </footer>
            </div>
        </div>
    );
})

export default Settings;
