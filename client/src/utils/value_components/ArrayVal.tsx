import React from 'react';
import { getVal } from '..';
import { observer } from 'mobx-react';
import store from '../../store';


type Props = {
    array: { [key: string]: any }
    index: number,
    objectId: string
}

const ArrayVal: React.FC<Props> = observer(({ array, index, objectId }) => {
    const val = array[index]
    const { highlight } = store.structs
    const { flash } = store.structs

    return (
        <div className={`
        array-val 
        ${highlight && highlight.object === objectId && highlight.prop === index && 'highlight'}
        ${flash && flash.object === objectId && flash.prop === index && 'flash'}
        `}>{getVal(val)}</div>
    );
})

export default ArrayVal;
