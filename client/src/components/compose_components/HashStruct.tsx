import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { observer } from 'mobx-react';
import store from '../../store';
import HashVal from './HashVal';
import genId from '../../utils/genId';
import invertColor from '../../utils/invertColor';

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
    const windowWidth = store.windowWidth
    const [node, setNode] = useState(null)
    const ref = useCallback((node) => {
        if (node) {
            setNode(node)
        }
    }, [])
    const renderId = useMemo(() => genId(objectId.length), [objectId])
    // const pos = store.structs.positions[objectId]
    // if (pos && pos.renderId && pos.renderId !== renderId) {
    //     return null
    // }


    useEffect(() => {
        if (node) {
            store.structs.setPosition(objectId, node, renderId)
        }
    })

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

    const active = pointed || store.structs.activePointers[objectId]
    const rotation = orientation === 'column' ? 90 : 0

    const braceStyle: React.CSSProperties = { transform: `rotate(${rotation}deg)`, color, zIndex: 5, transition: `transform .5s` }
    if (active) {
        braceStyle.transform += ' scale(2)'
    }
    return (
        <div style={styles} ref={ref} className={`hash-struct`}>
            <div className="is-size-1" style={braceStyle}>{`{`}</div>
            {obj}
            <div className="is-size-1" style={braceStyle}>{'}'}</div>
        </div>
    );
})

export default HashStruct;
