import React from 'react';
import ArrayVal from './ArrayVal';
import { observer } from 'mobx-react';
import store from '../../store';
import { toJS } from 'mobx';

type Props = {
    structure: Viz.Structure,
    objectId: string,
    ratio: number,
    pointed: boolean
}

const ArrayStruct: React.FC<Props> = observer(({ structure, objectId, ratio, pointed }) => {
    const arr: React.ReactElement[] = [];
    const maxWidth = store.windowWidth * .5 * store.widths.array
    let len;
    try {
        len = structure['length'].value
    } catch (e) {
        console.log(toJS(structure));
        throw e
    }
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
    const color = store.settings.structColors['Array']
    const styles: React.CSSProperties = {
        margin: `${size}px`,
        padding: `${size}px`,
        flexDirection: display as 'row' | 'column',
        backgroundImage: `linear-gradient(${color}, ${color}),
        linear-gradient(${color}, ${color}),
        linear-gradient(${color}, ${color}),
        linear-gradient(${color}, ${color})`,
        backgroundSize: `4px 20px, 20px 4px, 4px 20px, 20px 4px`
    }
    if (pointed || store.structs.activePointers[objectId]) {
        styles.boxShadow = `0 0 5px 2.5px ${color}`;
    }

    if (display === 'row') {
        styles.height = valSize * 1.5 + 5
    } else {
        styles.maxHeight = '100%'
        styles.overflowY = 'scroll'
    }
    return (
        <div className={`array-struct`} style={styles}>
            {arr}
        </div>
    );
})

export default ArrayStruct;
