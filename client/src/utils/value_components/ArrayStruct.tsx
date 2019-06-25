import React from 'react';
import { getVal } from '..';
import ArrayVal from './ArrayVal';
import { observer } from 'mobx-react';

type Props = {
    structure: Viz.Structure,
    objectId: string
}

const ArrayStruct: React.FC<Props> = observer(({ structure, objectId }) => {
    const arr: React.ReactElement[] = [];
    for (let i = 0; i < structure['length']; i++) {
        arr.push(
            <ArrayVal key={i} index={i} objectId={objectId} array={structure} />
        )
    }
    return (
        <div className="array-struct">
            {arr}
        </div>
    );
})

export default ArrayStruct;
