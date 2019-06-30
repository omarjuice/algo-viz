import React from 'react';
import ArrayVal from './ArrayVal';
import { observer } from 'mobx-react';
import store from '../../store';

type Props = {
    structure: Viz.Structure,
    objectId: string,
    ratio: number,
    pointed: boolean
}

const ArrayStruct: React.FC<Props> = observer(({ structure, objectId, ratio, pointed }) => {
    const arr: React.ReactElement[] = [];
    const maxWidth = store.windowWidth * .6
    const len = structure['length'].value
    const valSize = Math.max(Math.min(maxWidth / (len * 2), 30) * ratio, .001)
    const display = store.structs.children[objectId].size > 0 ? 'column' : 'row'
    for (let i = 0; i < len; i++) {
        arr.push(
            <ArrayVal display={display}
                ratio={ratio} size={valSize}
                key={i} index={i} objectId={objectId} array={structure} />
        )
    }

    const size = Math.max(Math.round(ratio * 5), 3)
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
        <div className={`array-struct ${(pointed || store.structs.activePointers[objectId]) && 'pointed'}`} style={styles}>
            {arr}
        </div>
    );
})

export default ArrayStruct;
