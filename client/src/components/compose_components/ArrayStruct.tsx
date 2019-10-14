import React, { useState, useCallback, useMemo, useEffect } from 'react';
import ArrayVal from './ArrayVal';
import { observer } from 'mobx-react';
import store from '../../store';
import genId from '../../utils/genId';

type Props = {
    structure: Viz.Structure,
    objectId: string,
    ratio: number,
    pointed: boolean
    renderId?: string
}


const iterate = (
    len: number,
    display: 'column' | 'row',
    ratio: number,
    valSize: number,
    objectId: string,
    structure: Viz.Structure,
    setChildren: (n: number) => void
) => {

    const arr = []
    len = Math.min(len, 1000)
    for (let i = 0; i < len; i++) {

        arr.push(
            <ArrayVal setChildren={setChildren} display={display}
                ratio={ratio} size={valSize}
                key={i} index={i} objectId={objectId} array={structure} />
        )
    }
    return arr
}

const ArrayStruct: React.FC<Props> = observer(({ structure, objectId, ratio, pointed, renderId }) => {
    const [node, setNode] = useState(null)
    const [children, setNumChildren] = useState<number>(0)
    const ref = useCallback((node) => {
        if (node) {
            setNode(node)
        }
    }, [])

    const setChildren = useCallback((n: number) => {
        setNumChildren(children + n)
    }, [children])

    renderId = useMemo(() => renderId || genId(objectId.length), [objectId, renderId])
    useEffect(() => {
        if (node) {
            store.structs.setPosition(objectId, node, renderId)
        }
    })
    const pos = store.structs.positions[objectId]

    const display: Viz.displayOrientation = children > 0 ? 'column' : 'row'



    const maxWidth = store.windowWidth * (store.structsWidth / 18) * store.widths.array

    const len = structure.get('length').value
    if (display === 'column') {
        ratio *= .7
    }
    const valSize = Math.max(Math.min(maxWidth / (len * 2), 30) * ratio, .001)


    const willRender = !(pos && pos.renderId && pos.renderId !== renderId)


    const config = store.settings.config;

    // eslint-disable-next-line
    const rerenderTrigger = [config['Callstack'], config["Code Display"], config["Step View"], config['Identifiers']]


    const arr: React.ReactNode[] = useMemo(
        () => willRender ? iterate(len, display, ratio, valSize, objectId, structure, setChildren) : [],
        [len, display, ratio, valSize, objectId, structure, willRender, setChildren]
    )
    if (!willRender) {
        return null
    }

    //IMPORTANT! The next two lines trigger a rerender when the layout changes so that line and arc pointers can adjust
    const type = store.viz.types[objectId]
    const size = Math.max(Math.round(ratio * 5), 3)
    const { color } = store.settings.structSettings[type]
    const active = pointed || store.structs.activePointers[objectId];
    const bkgExtend = active ? `${Math.min(len * valSize * 2 + 100, 2000)}px` : '20px'
    const styles: React.CSSProperties = {
        margin: `${ratio < 1 ? 0 : size}px`,
        padding: `${size}px`,
        flexDirection: display,
        backgroundImage: `linear-gradient(${color}, ${color}),
        linear-gradient(${color}, ${color}),
        linear-gradient(${color}, ${color}),
        linear-gradient(${color}, ${color})`,
        backgroundSize: `4px ${bkgExtend}, ${bkgExtend} 4px, 4px ${bkgExtend}, ${bkgExtend} 4px`,
        transition: `background-size 1s`
    }


    if (display === 'row') {
        styles.height = valSize * 1.5 + 5
    } else {

        styles.maxHeight = store.windowHeight / (store.structsWidth < 10 ? (store.numStructs[2] + 1) : 1)
        styles.overflowY = 'scroll'
    }
    return (
        <div className={`array-struct`} ref={ref} style={styles}>
            {arr}
        </div>
    );
})

export default ArrayStruct;
