import React from 'react';

import store from '../../store';
import DataChild from './DataChild';
import ValDisplay from './ValDisplay';
import { observer } from 'mobx-react';
import invertColor from '../../utils/invertColor';


type Props = {
    structure: Viz.Structure
    objectId: string
    ratio: number
    pointed: boolean
}
type DisplayProps = {
    color: string
    size: number
    anim: Viz.anim
    objectId: string
    textDisplay: string
    textColor?: string
}

const getDataVal = (value: any, displayProps: DisplayProps) => {
    const { settings: { valueColors: colors } } = store
    if (typeof value === 'boolean') {
        displayProps.textDisplay = value ? 'T' : 'F'
        return <ValDisplay {...displayProps} />
    } else if (typeof value === 'string') {
        if (value in store.viz.types) {
            if (value in store.structs.objects) {
                // return <Pointer active={!!displayProps.anim[0]} id={value} color={"white"} size={displayProps.size} />
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


const DataStruct: React.FC<Props> = observer(({ structure, objectId, ratio, pointed }) => {
    const type = store.viz.types[objectId]
    const width = store.windowWidth * .5 * ratio
    const color = store.settings.structColors[type]
    const settings = store.settings.structSettings[type]
    const styles: React.CSSProperties = {
        width,
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'center',
    }
    // if (pointed || store.structs.activePointers[objectId]) {
    //     styles.boxShadow = `0 0 5px 2.5px ${color}`;
    // }

    const childKeys: { [key: string]: string } = {}

    for (const key in structure) {
        const value = structure[key].value
        if (typeof value === 'string' && value in store.structs.objects) {
            childKeys[value] = key
        }
    }
    let children: ({
        order: Viz.order
        key: string | number
        child: string | null
        parent: Viz.Structure
    })[] = []

    const main = structure[settings.main]
    store.structs.children[objectId].forEach(child => {
        const key = childKeys[child]
        const order = settings.order[key]
        if (order && order.isMultiple) {
            const object = store.structs.objects[child]
            const type = store.viz.types[child]
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
                    child,
                    parent: structure
                }
            )
        }
    })
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
        const usedPositions = {}
        children.forEach(child => {
            let pos = child.order.pos - 1
            while (pos in usedPositions) {
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
    const anim: Viz.anim = [main && main.get, main && main.set]
    const size = Math.min(30, Math.max(width - 1, 1))
    const displayProps: DisplayProps = {
        objectId,
        color: color,
        size,
        anim,
        textDisplay: "",
        textColor: invertColor(color)
    }
    return (
        <div className={'data-struct'} style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
        }} >
            <div> {getDataVal(main ? main.value : '', displayProps)} </div>
            <div style={styles}>
                {children.map(({ child, key, parent }) => {
                    if (!child) {
                        return <div style={{
                            width: (styles.width as number) / children.length
                        }} />

                    } else {
                        return (
                            <DataChild
                                key={child} parent={parent}
                                objectId={child}
                                ratio={ratio / (settings.numChildren === null ? children.length : settings.numChildren)}
                                prop={key} />)

                    }
                })}
            </div>
        </div>
    )
})

export default DataStruct