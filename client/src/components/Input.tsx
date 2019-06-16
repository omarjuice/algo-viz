import React, { Component } from 'react';
import store from '../store'
import { observer } from 'mobx-react';

@observer
class Input extends Component {
    state = {
        error: false,
        code: store.viz.code.trim()
    }
    handSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        store.api.runCode(this.state.code)
    }
    handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        this.setState({ code: e.target.value })
    }
    render() {
        return (
            <form className="form"
                onSubmit={this.handSubmit}>
                <textarea className="textarea"
                    cols={75}
                    rows={30}
                    onChange={this.handleChange}
                    value={this.state.code}>
                </textarea>
                <button className={`button is-primary ${store.api.loading && 'is-loading'}`} disabled={store.api.loading}>Run</button>
            </form>
        );
    }
}

export default Input;
