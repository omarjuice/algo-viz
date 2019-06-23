import React, { Component } from 'react';
import store from '../store'
import { observer } from 'mobx-react';
import MonacoEditor from 'react-monaco-editor'
import * as monaco from 'monaco-editor';
import pastels from '../utils/pastels.json'
let Pastels = pastels as any
monaco.editor.defineTheme('pastels', Pastels)
@observer
class Input extends Component {

    componentDidMount() {
        const code = document.querySelector('.react-monaco-editor-container') as HTMLElement
        if (code) {
            monaco.editor.colorizeElement(code, { theme: 'vs-dark' })
        }
    }

    render() {
        return (
            <MonacoEditor
                width="50vw"
                height="600"
                language="javascript"
                theme="vs-dark"
                value={store.editor.code}
                options={{ theme: 'pastels' }}
                onChange={(code) => store.editor.code = code}
            />

        );
    }
}

export default Input;
