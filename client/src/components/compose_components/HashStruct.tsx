import React from 'react';
import { observer } from 'mobx-react';
import store from '../../store';
import HashVal from './HashVal';

type Props = {
    structure: Viz.Structure,
    objectId: string,
    ratio: number,
    pointed: boolean
    orientation: 'row' | 'column'
}

const HashStruct: React.FC<Props> = observer(({ structure, objectId, ratio, pointed, orientation }) => {
    const obj: React.ReactElement[] = [];
    // const maxWidth = store.windowWidth * .3 * ratio

    for (const key in structure) {
        obj.push(
            <div key={key}>
                <HashVal orientation={orientation} prop={key} objectId={objectId} ratio={ratio} size={30} object={structure} />
            </div>
        )
    }

    // const size = Math.max(Math.round(ratio * 5), 3)
    const styles: React.CSSProperties = {
        // maxHeight: '100%',
        // overflowY: 'scroll'
        flexDirection: orientation
    }
    const type = store.viz.types[objectId]
    const color = store.settings.structColors[type] || 'white'
    if (pointed || store.structs.activePointers[objectId]) {
        styles.boxShadow = `0 0 5px 2.5px ${color}`
    }
    const rotation = orientation === 'column' ? 90 : 0
    return (
        <div style={styles} className={`hash-struct`}>
            <div className="is-size-1" style={{ transform: `rotate(${rotation}deg)`, color }}>{`{`}</div>
            {obj}
            <div className="is-size-1" style={{ transform: `rotate(${rotation}deg)`, color }}>{'}'}</div>
        </div>
    );
})

export default HashStruct;
