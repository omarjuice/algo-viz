import React from 'react';
import ArrayVal from './ArrayVal';
import { observer } from 'mobx-react';

type Props = {
    structure: Viz.Structure,
    objectId: string,
    size: number,
    elemSize: number
}

const ArrayStruct: React.FC<Props> = observer(({ structure, objectId, size, elemSize }) => {
    const arr: React.ReactElement[] = [];
    for (let i = 0; i < structure['length'].value; i++) {
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
