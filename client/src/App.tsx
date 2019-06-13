import React from 'react';
import { observer } from 'mobx-react';
import store from './store/index';


@observer
class App extends React.Component {
  render() {
    let counter: number = 0
    let flag = false
    const tab = (key: number) => <span key={key} className="tab">{' '}</span>
    return (
      <div>
        <div className="user-code">{
          store.code.tokenMap.map((token, i) => {
            if (token.char === '{') {
              counter++
            } else if (token.char === '}') {
              counter--
            }
            if (token.char === '\n') {
              flag = true
              return <br key={i} />
            } else {
              let shouldTab = flag
              flag = false

              return <span key={i}>
                {shouldTab ? new Array(counter).fill('x').map((_, i) => tab(i)) : ''}
                <span className={token.highlight ? 'highlight' : ''}>
                  {token.char}
                </span>
              </span>
            }
          })
        }</div>
        <button onClick={() => store.iterator.next()} >Next</button>
      </div>
    );
  }
}

export default App;
