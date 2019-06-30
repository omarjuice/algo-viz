import React, { useState } from 'react';
import { getVal } from './getVal';
import { observer } from 'mobx-react';
import Tooltip from 'rc-tooltip';
import 'rc-tooltip/assets/bootstrap.css'
import store from '../../store';
import ArrayStruct from './ArrayStruct';
import Pointer from './Pointer';
import ArrayValDisplay from './ArrayValDisplay';
type ArrayValProps = {
    array: Viz.Structure
    index: number
    objectId: string
    size: number
    ratio: number
    display: 'row' | 'column'
}


type DisplayProps = {
    color: string
    size: number
    anim: Viz.anim
    objectId: string
    textDisplay: string
}



const getArrayVal = (value: any, displayProps: DisplayProps) => {
    const { globals: { colors } } = store
    if (typeof value === 'boolean') {
        displayProps.color = colors.boolean
        displayProps.textDisplay = value ? 'T' : 'F'
        return <ArrayValDisplay {...displayProps} />
    } else if (typeof value === 'string') {
        if (value in store.viz.types) {
            if (value in store.viz.objects) {
                return <Pointer active={!!displayProps.anim[0]} id={value} color={"white"} size={displayProps.size} />
            }
            if (store.viz.types[value] === '<empty>') {
                displayProps.color = store.globals.background
            } else {
                displayProps.color = colors.special
            }

        } else {
            displayProps.color = colors.string
            if (value.length < 4) displayProps.textDisplay = value
        }
        return <ArrayValDisplay {...displayProps} />
    } else if (typeof value === 'number') {
        displayProps.color = colors.number
        const strVal = String(value)
        let len = strVal.length
        if (strVal[0] === '-')--len
        if (len < 3) displayProps.textDisplay = strVal
        return <ArrayValDisplay {...displayProps} />
    }

    return <ArrayValDisplay {...displayProps} />
}

const ArrayVal: React.FC<ArrayValProps> = observer(({ array, index, objectId, size, ratio }) => {
    const [hovered, toggle] = useState(false)
    if (!(index in array)) return null;
    const info = array[index]
    let value = info.value
    const className = `${!!info.get && 'get'} ${!!info.set && 'set'} ${objectId}`
    const anim: Viz.anim = [info.get, info.set]
    const displayProps: DisplayProps = {
        objectId,
        color: store.globals.colors.other,
        size,
        anim,
        textDisplay: "",
    }
    if (typeof value === 'string') {
        const type = store.viz.types[value]
        if (type === 'Array') {
            const parents = store.structs.pointers.get(value)
            let flag = false
            if (parents) {
                const firstParent = parents.entries().next().value
                if (firstParent) {
                    const [parentId, [key]] = firstParent
                    if (parentId !== objectId || (parentId === objectId && key !== index)) {
                        flag = true
                    }
                }
            }
            if (store.structs.bindings.has(value)) flag = true
            if (!flag) {
                return (
                    <div className={`array-line ${className}`}>
                        <ArrayStruct pointed={!!anim[0]} objectId={value} structure={store.structs.objects[value]} ratio={(.9) * ratio} />
                    </div>
                )
            }
        }
    }
    const style: React.CSSProperties = {
        margin: `4px ${size / 5}px`,
        height: `${Math.max(size * 1.5)}px`,
    }
    const visible = (!!info.get || !!info.set)
    return (
        <div
            onMouseEnter={() => {
                toggle(true)
                store.structs.switchOff(info, 'get', objectId)
                store.structs.switchOff(info, 'set', objectId)
            }}
            onMouseLeave={() => {
                toggle(false)
            }}
            className={`
            array-val 
            ${className}
                `}
            style={style}
        >
            <Tooltip overlay={() => (
                <div className="has-text-weight-bold">
                    <span style={{ fontSize: 9 }}> {index}:{' '}</span>
                    {getVal(value, true)}
                </div >)}
                placement={(!!info.set && 'bottom') || ((!!info.get || hovered) && 'top') || 'top'}
                trigger={['hover']} visible={visible || hovered} defaultVisible={false} >
                {getArrayVal(value, displayProps)}
            </Tooltip>
        </div >
    );


})

export default ArrayVal;
