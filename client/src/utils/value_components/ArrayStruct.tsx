import React, { useState, useEffect } from 'react';
import ArrayVal from './ArrayVal';
import { observer } from 'mobx-react';
import store from '../../store';

type Props = {
    structure: Viz.Structure,
    objectId: string,
    ratio: number,
    parent: null | string
}

const ArrayStruct: React.FC<Props> = observer(({ structure, objectId, ratio, parent }) => {
    const arr: React.ReactElement[] = [];
    const maxWidth = store.windowWidth * .6
    const len = structure['length'].value
    const [display, setDisplay] = useState('column')
    const valSize = Math.max(Math.min(maxWidth / (structure['length'].value * 2), 30) * ratio, 3)
    useEffect(() => {
        if (!store.structs.children.has(objectId)) {
            store.structs.children.set(objectId, parent)
        }
    })
    for (let i = 0; i < len; i++) {
        arr.push(
            <ArrayVal setDisplay={setDisplay} display={display as 'row' | 'column'}
                ratio={ratio} size={valSize}
                key={i} index={i} objectId={objectId} array={structure} />
        )
    }
    const size = Math.max(Math.floor(ratio * 5), 1)
    const styles: React.CSSProperties = {
        margin: `${size}px`,
        padding: `${size}px`,
        flexDirection: display as 'row' | 'column',
    }
    if (ratio < 1) {
        // styles.top = `${Math.round(15 * ratio)}px`
    }
    if (display === 'row') {
        styles.height = valSize * 1.5
    }
    return (
        <div className="array-struct" style={styles}>
            {arr}
        </div>
    );
})

export default ArrayStruct;
