import React from 'react';
import './App.css'
import { observer } from 'mobx-react';
import store from './store/index';


@observer
class App extends React.Component {
  render() {
    return (
      <div>
        <div>{
          store.code.tokenMap.map(token => {
            return token.char === '\n' ? <div key={token.index} /> : <span key={token.index} className={token.highlight ? 'highlight' : ''}>{token.char}</span>
          })
        }</div>
        <button onClick={() => store.iterator.next()} >Next</button>
      </div>
    );
  }
}

export default App;
