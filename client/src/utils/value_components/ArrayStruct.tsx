import React, { useState, useEffect } from 'react';
import ArrayVal from './ArrayVal';
import { observer } from 'mobx-react';
import store from '../../store';

type Props = {
    structure: Viz.Structure,
    objectId: string,
    ratio: number,
    pointer: Viz.pointer | null
}

const ArrayStruct: React.FC<Props> = observer(({ structure, objectId, ratio, pointer }) => {
    const arr: React.ReactElement[] = [];
    const maxWidth = store.windowWidth * .6
    const len = structure['length'].value
    const [display, setDisplay] = useState('row')
    const valSize = Math.max(Math.min(maxWidth / (len * 2), 30) * ratio, .001)

    for (let i = 0; i < len; i++) {
        arr.push(
            <ArrayVal setDisplay={setDisplay} display={display as 'row' | 'column'}
                ratio={ratio} size={valSize}
                key={i} index={i} objectId={objectId} array={structure} />
        )
    }
    const size = Math.max(Math.floor(ratio * 5), 3)
    const styles: React.CSSProperties = {
        margin: `${size}px`,
        padding: `${size}px`,
        flexDirection: display as 'row' | 'column',
    }

    if (display === 'row') {
        styles.height = valSize * 1.5 + 5
    } else {
        styles.maxHeight = '100%'
        styles.overflowY = 'scroll'
    }
    return (
        <div className="array-struct" style={styles}>
            {arr}
        </div>
    );
})

export default ArrayStruct;
