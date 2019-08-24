import React, { useEffect, useMemo, useState, useCallback } from 'react';
import store from '../../store';
import DataChild from './DataChild';
import { observer } from 'mobx-react';
import ValText from './ValText';
import Tooltip from 'rc-tooltip';
import genId from '../../utils/genId';
import ArcPointer from './ArcPointer';
import getType from '../../utils/getType';
import getVal from '../../utils/getVal';


type Props = {
    structure: Viz.Structure
    objectId: string
    ratio: number
    renderId?: string
    isList?: boolean
    idx?: number
    depth: number
}

const DataStruct: React.FC<Props> = observer(({ structure, objectId, ratio, renderId, isList, idx, depth }) => {
    const [node, setNode] = useState(null)

    const type = store.viz.types[objectId]

    const settings = store.settings.structSettings[type]

    isList = isList && settings.numChildren === 1

    const pos = store.structs.positions[objectId]
    renderId = useMemo(() => {
        return renderId || genId(objectId.length + 3)
    }, [objectId, renderId])
    const ref = useCallback((elem) => {
        if (idx) { }//For rerender
        if (elem) {
            if (!node) {
                if (!isList) {
                    setNode(elem)
                } else {
                    setImmediate(() => setNode(elem))
                }
            }
        }
    }, [node, idx, isList])


    useEffect(() => {
        if (node) {
            store.structs.setPosition(objectId, node, renderId)

        }
    })
    const main = structure.get(settings.main)
    const get = main && main.get
    const set = main && main.set
    const anim: Viz.anim = useMemo(() => [get, set], [get, set])

    if (pos && pos.renderId && pos.renderId !== renderId) {
        return null
    }
    //IMPORTANT! The next two lines trigger a rerender when the layout changes so that line and arc pointers can adjust
    const config = store.settings.config;
    const rerenderTrigger = [config['Callstack'], config["Code Display"], config["Step View"], config['Identifiers'], ...store.numStructs, store.widths.data]

    const width = store.windowWidth * ((store.structsWidth >= 10 ? store.structsWidth / 24 : .5)) * ratio
    const color = store.settings.structColors[type]

    const styles: React.CSSProperties = {
        width,
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'center',
    }
    if (isList) {
        styles.width = Math.max(Math.min(width, 30) * ratio, .001)
        styles.justifyContent = 'space-between'
        styles.marginLeft = '10px'
    }


    const otherKeys: [string | number, any][] = []
    const pointers: React.ReactNode[] = []
    let children: ({
        order: Viz.order
        key: string | number
        child: string | null
        parent: Viz.Structure
    })[] = []

    for (const [key, prop] of structure.entries()) {
        const { value } = prop
        if (typeof value === 'string' && value in store.structs.objects && value !== objectId && (key in settings.pointers || key in settings.order)) {
            if (key in settings.pointers) {
                const pointer: boolean = settings.pointers[key]
                const info = structure.get(key)
                if (!pointer) {
                    pointers.push(
                        <ArcPointer prop={key} key={key} from={objectId} to={value} get={!!info.get} set={!!info.set}>
                            {null}
                        </ArcPointer >
                    )
                } else {
                    const object = store.structs.objects[value]
                    for (const key of object.keys()) {
                        const info = object.get(key)
                        if (typeof info.value === 'string' && info.value in store.structs.objects) {
                            pointers.push(
                                <ArcPointer prop={key} key={value + key} from={objectId} to={info.value} get={!!info.get} set={!!info.set}>
                                    {null}
                                </ArcPointer >
                            )
                        }
                    }
                }
            } else if (key in settings.order) {
                const parent = store.structs.pointers.get(value).top

                const info = structure.get(key)
                if (parent && (objectId !== parent.id || key !== parent.key) && store.structs.bindings.has(parent.id)) {
                    pointers.push(
                        <ArcPointer prop={key} key={key} from={objectId} to={value} get={!!info.get} set={!!info.set}>
                            {null}
                        </ArcPointer >
                    )
                    continue;
                }

                const order = settings.order[key]

                if (order && order.isMultiple) {
                    const object = store.structs.objects[value]
                    const type = store.viz.types[value]
                    if (['Object', 'Array', 'Map'].includes(type)) {
                        for (const key of object.keys()) {
                            const info = object.get(key)
                            if (typeof info.value === 'string' && info.value in store.structs.objects) {
                                children.push({
                                    order,
                                    key: type === 'Array' ? Number(key) : key,
                                    child: info.value,
                                    parent: object
                                })
                            }
                        }
                    }
                    otherKeys.push([key, value])


                } else {
                    children.push(
                        {
                            order: order || { pos: Infinity, isMultiple: false },
                            key,
                            child: value,
                            parent: structure
                        }
                    )
                }
            }
        } else {
            otherKeys.push([key, value])
        }
    }



    if (settings.numChildren === null) {
        children.sort((a, b) => {
            if (a.order.pos === b.order.pos) {
                return a.key > b.key ? 1 : -1
            } else {
                return a.order.pos - b.order.pos
            }
        })
    } else {
        let newList = new Array(settings.numChildren)
        children.forEach(child => {
            let pos = child.order.pos === Infinity ? newList.length - 1 : child.order.pos - 1
            while (newList[pos]) {
                const current = newList[pos].order
                if (current.pos === Infinity) {
                    newList[pos] = child
                    child = newList[pos]
                }
                pos--
                if (pos < 0) pos = newList.length - 1
            }
            newList[pos] = child
        })
        children = newList
        for (let i = 0; i < children.length; i++) {
            if (!(i in children)) {
                children[i] = {
                    child: null,
                    key: null,
                    order: null,
                    parent: null
                }
            }
        }
    }

    const size = Math.min(30, Math.max(width - 1, 1))
    const displayProps: Viz.DisplayProps = {
        objectId,
        color,
        size,
        anim,
        textDisplay: "",
        textColor: store.settings.configColors['Background'],
        highlight: store.structs.activePointers[objectId]
    }
    return (
        <div className={'data-struct'} style={{
            display: 'flex',
            flexDirection: isList ? 'row' : 'column',
            alignItems: 'center',
        }} >
            <Tooltip overlay={() => (
                <div>
                    {otherKeys.map(([key, value]) => {
                        return <div key={key} className="has-text-weight-bold">
                            <span style={{ fontSize: 9 }}> {key}:{' '}</span>
                            {value === objectId ? <span className="has-text-danger">this</span> : <ValText value={value} type={getType(value)} textOnly={false} size={10} />}
                        </div >
                    })}
                </div>
            )}
                placement={'top'}
                trigger={['hover']} defaultVisible={false} >
                <div ref={ref}
                    onMouseEnter={() => store.structs.activePointers[objectId] = true}
                    onMouseLeave={() => store.structs.activePointers[objectId] = false}
                    style={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        marginBottom: '10px'
                    }}> {getVal(main ? main.value : '', displayProps, getType(main ? main.value : null), true, true)} </div>
            </Tooltip>
            {node && (
                <div style={styles}>
                    {children.map(({ child, key, parent }, i) => {
                        if (!child) {
                            return <div key={i} style={{
                                width: (styles.width as number) / children.length
                            }} />

                        } else {
                            return (
                                <DataChild
                                    depth={depth + 1}
                                    idx={idx}
                                    key={child} parent={parent}
                                    parentId={objectId}
                                    objectId={child}
                                    ratio={ratio / (settings.numChildren === null ? children.length : settings.numChildren)}
                                    prop={key}
                                    isList={isList} />

                            )


                        }
                    })}
                </div>
            )}
            {node && pointers}
        </div>
    )
})

export default DataStruct