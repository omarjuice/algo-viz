/// <reference path="./types.d.ts" />
import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'mobx-react'
import App from './App';
import * as serviceWorker from './serviceWorker';
import store from './store';

const Root = (
    <Provider
        RootStore={store}
        IteratorStore={store.iterator}
        VizStore={store.viz}
        CodeStore={store.code} >
        <App />
    </Provider>
)

ReactDOM.render(Root, document.getElementById('root'));

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
