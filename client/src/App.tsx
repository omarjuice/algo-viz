import React from 'react';
import { observer } from 'mobx-react';
import store from './store/index';
import Code from './components/Code'

@observer
class App extends React.Component {
  render() {

    return (
      <div>
        <Code />
        <button onClick={() => store.iterator.next()} >Next</button>
      </div>
    );
  }
}

export default App;
