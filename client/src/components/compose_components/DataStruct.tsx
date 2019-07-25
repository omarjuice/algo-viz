import React, { useEffect, useMemo, useState, useCallback, ReactNode } from 'react';
import store from '../../store';
import DataChild from './DataChild';
import ValDisplay from './ValDisplay';
import { observer } from 'mobx-react';
import invertColor from '../../utils/invertColor';
import { getVal } from './getVal';
import Tooltip from 'rc-tooltip';
import genId from '../../utils/genId';
import ArcPointer from './ArcPointer';
import Pointer from './Pointer';


type Props = {
    structure: Viz.Structure
    objectId: string
    ratio: number
    renderId?: string
    isList?: boolean
    idx?: number
}
type DisplayProps = {
    color: string
    size: number
    anim: Viz.anim
    objectId: string
    textDisplay: string
    textColor?: string
    highlight?: boolean
}

const getDataVal = (value: any, displayProps: DisplayProps, objectId: string) => {
    if (typeof value === 'boolean') {
        displayProps.textDisplay = value ? 'T' : 'F'
        return <ValDisplay {...displayProps} />
    } else if (typeof value === 'string') {
        if (value in store.viz.types) {
            if (value === objectId) {
                displayProps.textDisplay = 'this'
                displayProps.textColor = 'red'
            } else {
                return <Pointer active={!!displayProps.anim[0]} id={value} size={displayProps.size} />
            }


        } else {
            if (value.length < 4) displayProps.textDisplay = value
        }
        return <ValDisplay {...displayProps} />
    } else if (typeof value === 'number') {
        const strVal = String(value)
        let len = strVal.length
        if (strVal[0] === '-')--len
        if (len < 4) displayProps.textDisplay = strVal
        return <ValDisplay {...displayProps} />
    }

    return <ValDisplay {...displayProps} />
}


const DataStruct: React.FC<Props> = observer(({ structure, objectId, ratio, renderId, isList, idx }) => {
    const [node, setNode] = useState(null)
    const type = store.viz.types[objectId]
    if (!type) return null
    const settings = store.settings.structSettings[type]

    isList = isList && settings.numChildren === 1

    const pos = store.structs.positions[objectId]
    renderId = useMemo(() => {
        return renderId || genId(objectId.length + 3)
    }, [objectId, renderId])
    const ref = useCallback((elem) => {
        if (idx) { }//For rerendered
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
    const main = structure[settings.main]
    const get = main && main.get
    const set = main && main.set
    const anim: Viz.anim = useMemo(() => [get, set], [get, set])
    if (pos && pos.renderId && pos.renderId !== renderId) {
        return null
    }

    const width = store.windowWidth * .5 * ratio * store.widths.data
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


    const otherKeys: React.ReactNode[] = []
    const pointers: React.ReactNode[] = []
    let children: ({
        order: Viz.order
        key: string | number
        child: string | null
        parent: Viz.Structure
    })[] = []

    for (const key in structure) {
        const value = structure[key].value

        if (typeof value === 'string' && value in store.structs.objects && value !== objectId && (key in settings.pointers || key in settings.order)) {
            if (key in settings.pointers) {
                const pointer: boolean = settings.pointers[key]
                if (!pointer) {
                    pointers.push(
                        <ArcPointer prop={key} key={key} from={objectId} to={value} get={!!structure[key].get} set={!!structure[key].set}>
                            {null}
                        </ArcPointer >
                    )
                } else {
                    const object = store.structs.objects[value]
                    for (const key in object) {
                        const info = object[key]
                        if (typeof info.value === 'string' && info.value in store.structs.objects) {
                            pointers.push(
                                <ArcPointer prop={key} key={value + key} from={objectId} to={info.value} get={!!object[key].get} set={!!object[key].set}>
                                    {null}
                                </ArcPointer >
                            )
                        }
                    }
                }
            } else if (key in settings.order) {
                const parents = store.structs.parents[value]
                if (parents) {
                    if (!parents.has(objectId)) {
                        const firstParent = parents.values().next().value
                        if (store.structs.bindings.has(firstParent)) {
                            pointers.push(
                                <ArcPointer prop={key} key={key} from={objectId} to={value} get={!!structure[key].get} set={!!structure[key].set}>
                                    {null}
                                </ArcPointer >
                            )
                            continue;
                        }
                    }
                }
                const order = settings.order[key]

                if (order && order.isMultiple) {
                    const object = store.structs.objects[value]
                    const type = store.viz.types[value]
                    if (['Object', 'Array', 'Map'].includes(type))
                        for (const key in object) {
                            const info = object[key]
                            if (typeof info.value === 'string' && info.value in store.structs.objects) {
                                children.push({
                                    order,
                                    key: type === 'Array' ? Number(key) : key,
                                    child: info.value,
                                    parent: object
                                })
                            }
                        }

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
            otherKeys.push(
                <div key={key} className="has-text-weight-bold">
                    <span style={{ fontSize: 9 }}> {key}:{' '}</span>
                    {value === objectId ? <span className="has-text-danger">this</span> : getVal(value, false, 10)}
                </div >
            )


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
    const displayProps: DisplayProps = {
        objectId,
        color: color,
        size,
        anim,
        textDisplay: "",
        textColor: invertColor(color),
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
                    {otherKeys}
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
                    }}> {getDataVal(main ? main.value : '', displayProps, objectId)} </div>
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