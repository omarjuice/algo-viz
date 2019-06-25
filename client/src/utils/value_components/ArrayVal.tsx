import React from 'react';
import { getVal } from '..';
import { observer } from 'mobx-react';


type Props = {
    array: Viz.Structure
    index: number,
    objectId: string
}

const ArrayVal: React.FC<Props> = observer(({ array, index, objectId }) => {
    const info = array[index]
    if (!(index in array)) return null;
    return (
        <div className={`
        array-val 
        ${info.highlight && 'highlight'}
        ${info.flash && 'flash'}
        ${objectId}
        `}>{getVal(info.value)}</div>
    );
})

export default ArrayVal;
