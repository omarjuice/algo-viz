import React from 'react';
import { observer } from 'mobx-react';
import Code from './components/Code'
import './App.sass'
import StepView from './components/StepView';
import Controller from './components/Controller';
import Identifiers from './components/Identifiers';
@observer
class App extends React.Component {
  render() {

    return (
      <div className="app has-background-info columns">
        <div className="column is-one-third">
          <Code />
          <Controller />
        </div>

        <div className="column is-one-third">
          <StepView />
        </div>
        <div className="column is-one-third">
          <Identifiers />
        </div>
      </div>
    );
  }
}

export default App;
