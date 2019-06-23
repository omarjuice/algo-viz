import React from 'react';
import store from '../store'
import { observer } from 'mobx-react';
import Input from './Input';
import Code from './Code';
import Controller from './Controller';

const LeftPanel: React.FC = observer(() => {
    const InputToggle: React.FC = () => (
        <button onClick={() => {
            store.editing = !store.editing
            store.api.error = null
        }} className="button is-small">
            {store.editing ? 'close' : 'code'}
        </button>
    )
    return (
        <div>
            {store.editing ?
                <>
                    <Input />
                    <InputToggle />
                </>
                :
                store.ready ? (
                    <>
                        <Code />
                        <Controller />
                        <InputToggle />
                    </>
                ) : <InputToggle />
            }
        </div>
    );
})

export default LeftPanel;
