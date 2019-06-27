import React, { useState } from 'react';
import ArrayVal from './ArrayVal';
import { observer } from 'mobx-react';
import store from '../../store';

type Props = {
    structure: Viz.Structure,
    objectId: string,
    ratio: number,
}

const ArrayStruct: React.FC<Props> = observer(({ structure, objectId, ratio }) => {
    const arr: React.ReactElement[] = [];
    const maxWidth = store.windowWidth * .6
    const len = structure['length'].value
    const [display, setDisplay] = useState('row')

    for (let i = 0; i < len; i++) {
        arr.push(
            <ArrayVal setDisplay={setDisplay} display={display as 'row' | 'column'}
                ratio={ratio} size={Math.max(Math.min(maxWidth / (structure['length'].value * 2), 30) * ratio, 3)}
                key={i} index={i} objectId={objectId} array={structure} />
        )
    }
    const size = Math.max(Math.floor(ratio * 5), 1)
    const styles: React.CSSProperties = {
        margin: `${size}px`,
        padding: `${size}px`,
        flexDirection: display as 'row' | 'column'
    }
    if (ratio < 1) {
        store.structs.children.add(objectId)
        styles.top = `${Math.round(11 * ratio)}px`
    }
    return (
        <div className="array-struct" style={styles}>
            {arr}
        </div>
    );
})

export default ArrayStruct;
