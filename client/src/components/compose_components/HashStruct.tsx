import React, { useState, useCallback, useMemo, useEffect, ReactNode } from 'react';
import { observer } from 'mobx-react';
import store from '../../store';
import HashVal from './HashVal';
import genId from '../../utils/genId';

type Props = {
    structure: Viz.Structure,
    objectId: string,
    ratio: number,
    pointed: boolean
    renderId?: string
}

const iterate = (structure: Viz.Structure, len: number, objectId: string, ratio: number, willRender: boolean, maxWidth: number): ReactNode[] => {
    const obj: ReactNode[] = []
    if (!willRender) return obj;
    const valSize = Math.max(Math.min(maxWidth / (len * 2), 30) * ratio, 15)
    // const valSize = Math.max(Math.min(maxWidth / (len * 2), 30) * ratio, .001)
    for (const key of structure.keys()) {
        obj.push(
            <div key={key}>
                <HashVal prop={key} objectId={objectId} ratio={ratio} size={valSize} object={structure} />
            </div>
        )
    }

    return obj
}

const HashStruct: React.FC<Props> = observer(({ structure, objectId, ratio, pointed, renderId }) => {

    const [node, setNode] = useState(null)
    const ref = useCallback((node) => {
        if (node) {
            setNode(node)
        }
    }, [])
    renderId = useMemo(() => renderId || genId(objectId.length), [objectId, renderId])

    const orientation = 'column'

    useEffect(() => {
        if (node) {
            store.structs.setPosition(objectId, node, renderId)
        }
    })
    const pos = store.structs.positions[objectId]
    const willRender: boolean = !(pos && pos.renderId && pos.renderId !== renderId)
    const len = structure.size

    const dimensionsMultiplier = (store.structsWidth >= 10 ? store.structsWidth / 24 : .5) * store.widths.object * ratio
    const maxWidth = store.windowWidth * dimensionsMultiplier
    const maxHeight = store.windowHeight * dimensionsMultiplier / 2
    const obj: ReactNode[] = useMemo(
        () => iterate(structure, len, objectId, ratio, willRender, maxWidth),
        [structure, len, objectId, ratio, willRender, maxWidth]
    );


    if (!willRender) return null;

    //IMPORTANT! The next two lines trigger a rerender when the layout changes so that line and arc pointers can adjust
    const config = store.settings.config;
    const rerenderTrigger = [config['Callstack'], config["Code Display"], config["Step View"], config['Identifiers']]


    const type = store.viz.types[objectId]

    const styles: React.CSSProperties = {
        minWidth: 150,
        maxHeight,
        overflowY: 'scroll',
        overflowX: 'visible',
        flexDirection: orientation
    }

    const color = store.settings.structColors[type] || 'white'

    const active = pointed || store.structs.activePointers[objectId]
    const rotation = 90

    const braceStyle: React.CSSProperties = { transform: `rotate(${rotation}deg)`, color, position: "relative", zIndex: 5, transition: `transform .5s` }
    if (active) {
        braceStyle.transform += ' scale(2)'
    }
    return (
        <div style={{ ...styles, maxHeight: maxHeight + 100, }} className={`hash-struct`}>
            <div className="is-size-1" style={braceStyle}>{`{`}</div>
            <div style={{ ...styles, minWidth: ['Object', 'Map'].includes(type) ? 200 : 100, minHeight: 50 }} ref={ref}>
                {obj}
            </div>
            <div className="is-size-1" style={braceStyle}>{'}'}</div>
        </div>
    );
})

export default HashStruct;
