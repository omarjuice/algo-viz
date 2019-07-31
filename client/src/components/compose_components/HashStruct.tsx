import React, { useState, useCallback, useMemo, useEffect, ReactNode } from 'react';
import { observer } from 'mobx-react';
import store from '../../store';
import HashVal from './HashVal';
import genId from '../../utils/genId';
import length from '../../utils/length';

type orientation = 'row' | 'column'
type Props = {
    structure: Viz.Structure,
    objectId: string,
    ratio: number,
    pointed: boolean
    orientation: orientation

}

const iterate = (structure: Viz.Structure, len: number, objectId: string, ratio: number, orientation: orientation, willRender: boolean, maxWidth: number): ReactNode[] => {
    const obj: ReactNode[] = []
    if (!willRender || !len) return obj;
    const valSize = Math.max(Math.min(maxWidth / (len * 2), 30) * ratio, 12.5)
    for (const key in structure) {
        if (key === length) continue;
        obj.push(
            <div key={key}>
                <HashVal orientation={orientation} prop={key} objectId={objectId} ratio={ratio} size={valSize} object={structure} />
            </div>
        )
    }
    return obj
}

const HashStruct: React.FC<Props> = observer(({ structure, objectId, ratio, pointed, orientation }) => {

    const [node, setNode] = useState(null)
    const ref = useCallback((node) => {
        if (node) {
            setNode(node)
        }
    }, [])
    const renderId = useMemo(() => genId(objectId.length), [objectId])



    useEffect(() => {
        if (node) {
            store.structs.setPosition(objectId, node, renderId)
        }
    })
    const pos = store.structs.positions[objectId]
    const willRender: boolean = !(pos && pos.renderId && pos.renderId !== renderId)
    const len = store.structs.objects[objectId][length].value
    const maxWidth = store.windowWidth * .5 * store.widths.object
    const obj: ReactNode[] = useMemo(
        () => iterate(structure, len, objectId, ratio, orientation, willRender, maxWidth),
        [structure, len, objectId, ratio, orientation, willRender, maxWidth]
    );


    if (!willRender) return null
    const styles: React.CSSProperties = {
        // maxHeight: '100%',
        // overflowY: 'scroll'
        flexDirection: orientation
    }
    const type = store.viz.types[objectId]
    const color = store.settings.structColors[type] || 'white'

    const active = pointed || store.structs.activePointers[objectId]
    const rotation = orientation === 'column' ? 90 : 0

    const braceStyle: React.CSSProperties = { transform: `rotate(${rotation}deg)`, color, position: "relative", zIndex: 5, transition: `transform .5s` }
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
