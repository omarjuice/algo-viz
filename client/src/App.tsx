import React from 'react';
import { observer } from 'mobx-react';
import './App.sass'
import StepView from './components/StepView';
import Identifiers from './components/Identifiers';
import CallStack from './components/CallStack';
import store from './store';
import LeftPanel from './components/LeftPanel';
import Convert from 'ansi-to-html';
const convert = new Convert()
@observer
class App extends React.Component {
  render() {
    const rightColWidth = store.editing ? "column is-2" : "column is-one-fifth"
    return (
      <div className="app has-background-info columns is-paddingless">
        {store.api.ok && <>
          <div className={store.editing ? "column is-half" : "column is-one-third"}>
            <LeftPanel />
          </div>
          {store.ready && !store.api.error && (
            <>
              <div className={rightColWidth}>
                <Identifiers />
              </div>
              <div className={rightColWidth}>
                <StepView />
              </div>
              <div className={rightColWidth}>
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
    );
  }
}

export default App;
