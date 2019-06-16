import React from 'react';
import { observer } from 'mobx-react';
import './App.sass'
import StepView from './components/StepView';
import Identifiers from './components/Identifiers';
import CallStack from './components/CallStack';
import store from './store';
import LeftPanel from './components/LeftPanel';

@observer
class App extends React.Component {
  render() {

    return (
      <div className="app has-background-info columns">
        {store.api.ok && <>
          <div className="column is-one-third">
            <LeftPanel />
          </div>
          {store.ready && (
            <>
              <div className="column is-one-fifth">
                <Identifiers />
              </div>
              <div className="column is-one-fifth">
                <StepView />
              </div>
              <div className="column is-one-fifth">
                <CallStack />
              </div>
            </>
          )}
        </>}
      </div>
    );
  }
}

export default App;
