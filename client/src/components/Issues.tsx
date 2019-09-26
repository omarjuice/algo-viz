import React, { Component } from 'react';
import store from '../store';
import { observer } from 'mobx-react';

type State = {
    description: string
}

@observer
class Issues extends Component<{}, State> {

    state: State = {
        description: ''
    }

    onSubmit = () => {
        if (this.state.description.length) {
            store.api.postIssue(this.state.description)
                .then(() => {
                    store.api.stopPostingIssue()
                    this.setState({
                        description: ''
                    })
                })
        }
    }
    render() {
        return (
            <div className={`modal ${store.api.issueForm && 'is-active'}`}>
                <div className="modal-background" onClick={() => store.api.stopPostingIssue()} />
                <div className="modal-card" style={{ backgroundColor: store.settings.configColors['Background'] }}>
                    <header style={{ backgroundColor: store.settings.configColors['Navbar'] }} className="modal-card-head">
                        <p className="modal-card-title">Report a Bug</p>
                        <button onClick={() => store.api.stopPostingIssue()} className="delete" aria-label="close"></button>
                    </header>
                    <section className="modal-card-body">
                        <form className="form">
                            <h1 className="title is-6 has-text-white">
                                Please describe the issue:
                                <br />

                            </h1>
                            <textarea onChange={(e) => this.setState({ description: e.target.value })} className="textarea">

                            </textarea>
                        </form>
                        <br />
                        <div className="has-text-centered">
                            <button onClick={this.onSubmit} className={`button is-success ${store.api.loading && 'is-loading'}`}>
                                Submit
                            </button>
                            <div className="has-text-white">
                                Your last executed code will be sent with your description.
                           </div>
                        </div>
                    </section>




                </div>
            </div>
        );
    }
}

export default Issues;
