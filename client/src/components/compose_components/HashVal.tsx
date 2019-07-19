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
    orientation: 'row' | 'column'
}


type DisplayProps = {
    color: string
    size: number
    anim: Viz.anim
    objectId: string
    textDisplay: string
    orientation: 'row' | 'column',
    type: string
}



const getHashVal = (value: any, displayProps: DisplayProps) => {

    const { settings: { valueColors: colors } } = store
    if (typeof value === 'boolean') {
        displayProps.color = colors.boolean
        displayProps.textDisplay = value ? 'T' : 'F'
    } else if (typeof value === 'string') {
        if (value in store.viz.types) {
            if (value in store.structs.objects) {
                return (
                    <Pointer active={!!displayProps.anim[0]} id={value} size={displayProps.size} />
                )
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
        if (len < 4) displayProps.textDisplay = strVal
    }
    return (
        <ValDisplay {...displayProps} />
    )
}

const HashVal: React.FC<ValProps> = observer(({ object, prop, objectId, size, ratio, orientation }) => {
    const [hovered, toggle] = useState(false)
    if (!(prop in object)) return null;
    const info = object[prop]
    let value = info.value
    const className = `${!!info.get && 'get'} ${!!info.set && 'set'} ${objectId}`
    const anim: Viz.anim = [info.get, info.set]
    const type = store.viz.types[objectId]
    const displayProps: DisplayProps = {
        objectId,
        color: store.settings.valueColors.other,
        size,
        anim,
        textDisplay: "",
        orientation,
        type
    }
    if (typeof value === 'string' && value in store.structs.objects && store.viz.types[value] === 'Array') {
        const parents = store.structs.parents[value]
        let flag = false
        if (parents) {
            if (!parents.has(objectId)) flag = true
            else {
                const pointers = store.structs.pointers.get(value)
                if (pointers) {
                    const refs = pointers.get(objectId)
                    if (refs[0] !== prop) {
                        flag = true
                    }
                }
            }
        }
        if (store.structs.bindings.has(value)) flag = true
        if (!flag) {
            return (
                <div className="columns is-paddingless is-multiline">
                    {type !== 'Set' && <div className={`column is-${orientation === 'row' ? 'full is-narrow has-text-centered' : 'half'}`}>
                        <p className={`is-size-6 ${(displayProps.anim[0] || displayProps.anim[1]) && 'has-text-white'}`}>
                            {type === 'Map' && prop in store.structs.objects ?
                                <Pointer active={!!displayProps.anim[0]} id={prop} size={displayProps.size} />
                                : prop.slice(0, 5) + (prop.length > 5 ? '...' : '')}
                        </p>
                    </div>}
                    <div className={`column is-${orientation === 'row' ? 'full is-narrow has-text-centered' : 'half'}`}>
                        <ArrayStruct pointed={!!anim[0]} objectId={value} structure={store.structs.objects[value]} ratio={(.5) * ratio} />
                    </div>
                </div>

            )
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
                    {type !== 'Set' && <span style={{ fontSize: 9 }}>
                        {type === 'Map' && prop in store.structs.objects ? store.viz.types[prop] : prop}:{' '}
                    </span>}
                    {getVal(value, true)}
                </div >
            )}
                placement={'right'}
                trigger={['hover']} visible={visible || hovered} defaultVisible={false} >
                <div className="columns is-paddingless is-multiline">
                    {type !== 'Set' && <div className={`column is-${orientation === 'row' ? 'full is-narrow has-text-centered' : 'half'}`}>
                        < p className={`is-size-6 ${(displayProps.anim[0] || displayProps.anim[1]) && 'has-text-white'}`}>
                            {type === 'Map' && prop in store.viz.types ? getVal(prop) : prop.slice(0, 5) + (prop.length > 5 ? '...' : '')}
                        </p>
                    </div>}
                    <div className={`column is-${orientation === 'row' ? 'full is-narrow has-text-centered' : 'half'}`}>
                        {getHashVal(value, displayProps)}
                    </div>
                </div>
            </Tooltip>
        </div >
    );


})

export default HashVal;
