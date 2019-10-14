import React, { Component } from 'react';
import store from '../store'
import { observer } from 'mobx-react';
import MonacoEditor from 'react-monaco-editor'
import * as monaco from 'monaco-editor';
import pastels from '../pastels.json'
const Pastels = pastels as any
monaco.editor.defineTheme('pastels', Pastels)



@observer
class Input extends Component {

    render() {
        return (
            <MonacoEditor
                width={store.windowWidth * .5}
                height={store.windowHeight * .91}
                language={store.language}
                theme="vs-dark"
                editorDidMount={(editor) => {
                    editor.updateOptions({
                        minimap: {
                            enabled: false
                        }
                    })
                }}
                value={store.editor.code}
                options={{ theme: 'pastels' }}
                onChange={(code) => store.editor.code = code}

            />
        );
    }
}

export default Input;
