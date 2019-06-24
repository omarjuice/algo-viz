import React from 'react';
import { getVal } from '..';

type Props = {
    structure: Viz.Structure
}

const ArrayStruct: React.FC<Props> = ({ structure }) => {
    const arr: React.ReactElement[] = [];
    for (let i = 0; i < structure['length'].value; i++) {
        const info = structure[i]
        arr.push(
            <div className="array-val" key={i}>{getVal(info.value)}</div>
        )
    }
    return (
        <div className="array-struct">
            {arr}
        </div>
    );
}

export default ArrayStruct;
