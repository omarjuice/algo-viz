import React from 'react';
import store from '../store'
import { observer } from 'mobx-react';
import Input from './Input';
import Code from './Code';
import IteratorContol from './IteratorControl';

const LeftPanel: React.FC = observer(() => {

    return (
        <div>
            {store.editor.active ?
                <>
                    <Input />
                </>
                :
                store.ready && (
                    <>
                        <Code />
                        <IteratorContol />

                    </>
                )
            }
        </div>
    );
})

export default LeftPanel;
