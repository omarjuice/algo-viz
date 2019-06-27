import React from 'react';
import ArrayVal from './ArrayVal';
import { observer } from 'mobx-react';
import store from '../../store';

type Props = {
    structure: Viz.Structure,
    objectId: string,
    ratio: number,
    elemSize: number
}

const ArrayStruct: React.FC<Props> = observer(({ structure, objectId, ratio }) => {
    const arr: React.ReactElement[] = [];
    const maxWidth = store.windowWidth * .6

    const len = structure['length'].value


    for (let i = 0; i < len; i++) {
        arr.push(
            <ArrayVal size={Math.min(maxWidth / (structure['length'].value * 2), 30) * ratio} key={i} index={i} objectId={objectId} array={structure} />
        )
    }
    return (
        <div className="array-struct">
            {arr}
        </div>
    );
})

export default ArrayStruct;
