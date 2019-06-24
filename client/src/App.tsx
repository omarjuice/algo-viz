import React from 'react';
import { observer } from 'mobx-react';
import './App.sass'
import StepView from './components/StepView';
import Identifiers from './components/Identifiers';
import CallStack from './components/CallStack';
import store from './store';
import LeftPanel from './components/LeftPanel';
import Convert from 'ansi-to-html';
import Navbar from './components/Navbar';
const convert = new Convert({ newline: true })
@observer
class App extends React.Component {
  render() {
    return (<>
      <div className="app ">
        <Navbar />
        <div className="columns is-paddingless">


          {store.api.ok && <>
            <div className={store.editor.active ? "column is-half" : "column is-one-third"}>
              <LeftPanel />
              {store.ready && !store.api.error && !store.editor.active && (
                <Identifiers />
              )}
            </div>
            {store.ready && !store.api.error && (
              <>
                <div className="column is-6">
                  <StepView />
                </div>
                <div className="column is-2">
                  <CallStack />
                </div>
              </>
            )}
            {store.api.error && (
              <div className="column is-half has-text-danger"
                dangerouslySetInnerHTML={{ __html: convert.toHtml(store.api.error) }}>

              </div>
            )}
          </>}
        </div>
      </div>
    </>
    );
  }
}

export default App;
