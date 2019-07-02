import React, { useState } from 'react';
import { getVal } from './getVal';
import { observer } from 'mobx-react';
import Tooltip from 'rc-tooltip';
import 'rc-tooltip/assets/bootstrap.css'
import store from '../../store';
import ArrayStruct from './ArrayStruct';
import Pointer from './Pointer';
import ValDisplay from './ValDisplay';
type ValProps = {
    object: Viz.Structure
    prop: string
    objectId: string
    size: number
    ratio: number
}


type DisplayProps = {
    color: string
    size: number
    anim: Viz.anim
    objectId: string
    textDisplay: string
}



const getHashVal = (key: string, value: any, displayProps: DisplayProps) => {
    key = String(key)
    const { settings: { colors } } = store
    if (typeof value === 'boolean') {
        displayProps.color = colors.boolean
        displayProps.textDisplay = value ? 'T' : 'F'
    } else if (typeof value === 'string') {
        if (value in store.viz.types) {
            if (value in store.viz.objects) {
                return <Pointer active={!!displayProps.anim[0]} id={value} color={"white"} size={displayProps.size} />
            }
            if (store.viz.types[value] === '<empty>') {
                displayProps.color = store.settings.background
            } else {
                displayProps.color = colors.special
            }

        } else {
            displayProps.color = colors.string
            if (value.length < 4) displayProps.textDisplay = value
        }
    } else if (typeof value === 'number') {
        displayProps.color = colors.number
        const strVal = String(value)
        let len = strVal.length
        if (strVal[0] === '-')--len
        if (len < 3) displayProps.textDisplay = strVal
    }
    return <div className="columns is-paddingless">
        <div className="column is-half">
            <p className={`is-size-6 ${(displayProps.anim[0] || displayProps.anim[1]) && 'has-text-white'}`}>
                {key.slice(0, 5) + (key.length > 5 ? '...' : '')}
            </p>
        </div>
        <div className="column is-half">
            <ValDisplay {...displayProps} />
        </div>
    </div>
}

const HashVal: React.FC<ValProps> = observer(({ object, prop, objectId, size, ratio }) => {
    const [hovered, toggle] = useState(false)
    if (!(prop in object)) return null;
    const info = object[prop]
    let value = info.value
    const className = `${!!info.get && 'get'} ${!!info.set && 'set'} ${objectId}`
    const anim: Viz.anim = [info.get, info.set]
    const displayProps: DisplayProps = {
        objectId,
        color: store.settings.colors.other,
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
                    if (parentId !== objectId || (parentId === objectId && key !== prop)) {
                        flag = true
                    }
                }
            }
            if (store.structs.bindings.has(value)) flag = true
            if (!flag) {
                return (
                    <div className={`hash-array-child columns is-mobile`}>
                        <div className={`column is-narrow is-size-6 ${(anim[0] || anim[1]) && 'has-text-white'}`}>
                            {prop}
                        </div>
                        {/* <div className="column is-1">

                        </div> */}
                        <div className="column is-narrow">
                            <ArrayStruct pointed={!!anim[0]} objectId={value} structure={store.structs.objects[value]} ratio={(.5) * ratio} />
                        </div>
                    </div>
                )
            }
        }
    }
    const style: React.CSSProperties = {
        margin: `${size / 5}px 0px`,
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
            hash-val 
            ${className}
                `}
            style={style}
        >
            <Tooltip overlay={() => (
                <div className="has-text-weight-bold">
                    <span style={{ fontSize: 9 }}> {prop}:{' '}</span>
                    {getVal(value, true)}
                </div >)}
                placement={'right'}
                trigger={['hover']} visible={visible || hovered} defaultVisible={false} >
                {getHashVal(prop, value, displayProps)}
            </Tooltip>
        </div >
    );


})

export default HashVal;
