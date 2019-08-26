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
import Structs from './components/Structs';
import Settings from './components/settings';
import InvalidScreenWidth from './components/InvalidScreenWidth';
import Issues from './components/Issues';
const convert = new Convert({ newline: true })

@observer
class App extends React.Component {
  render() {
    const codeDisplay = store.settings.config['Code Display'];
    const identifiers = store.settings.config['Identifiers']
    let switchStepView = !codeDisplay || !identifiers;
    let renderWithStructs = true
    if (!codeDisplay && !identifiers) {
      renderWithStructs = false;
      switchStepView = false
    }
    return store.isInvalidScreenWidth ? <InvalidScreenWidth /> : (
      <>
        <Settings />
        <Issues />
        <div className="app ">
          <Navbar />
          <div className="columns is-multiline is-paddingless">
            {store.api.ok && <>
              <div className={store.editor.active ? "column is-half" : "column is-one-third"}>
                <LeftPanel />
                {store.ready && !store.api.error && !store.editor.active && (
                  <>
                    <Identifiers />
                    {switchStepView && <StepView />}
                  </>
                )}
              </div>
              {store.ready && !store.api.error && (
                <>
                  {!renderWithStructs && (
                    <div style={{ marginTop: '1rem' }} >
                      <StepView />
                    </div>
                  )}
                  <div className={`column is-${store.structsWidth}`} >
                    {!switchStepView && renderWithStructs && <StepView />}
                    <Structs />
                  </div>
                  <CallStack />
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
