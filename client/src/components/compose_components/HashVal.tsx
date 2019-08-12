import React, { useState, useMemo } from 'react';
import { getVal } from './getVal';
import { observer } from 'mobx-react';
import Tooltip from 'rc-tooltip';
import 'rc-tooltip/assets/bootstrap.css'
import store from '../../store';
import Pointer from './Pointer';
import ValDisplay from './ValDisplay';
import ArrayChild from './ArrayChild';
type ValProps = {
    object: Viz.Structure
    prop: string
    objectId: string
    size: number
    ratio: number
}


type DisplayProps = Viz.DisplayProps & { type: string }

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

const HashVal: React.FC<ValProps> = observer(({ object, prop, objectId, size, ratio }) => {
    const [hovered, toggle] = useState(false)
    const willRender = object.has(prop)
    const info = willRender ? object.get(prop) : { get: false, set: false, value: null }
    let value = info.value
    const { get, set } = info
    const anim: Viz.anim = useMemo(() => [get, set], [get, set])
    const className = `${get && 'get'} ${set && 'set'} ${objectId}`
    if (!willRender) return null;
    const type = store.viz.types[objectId]
    const displayProps: DisplayProps = {
        objectId,
        color: store.settings.valueColors.other,
        size,
        anim,
        textDisplay: "",
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
                    {type !== 'Set' && <div className={`column`}>
                        <p className={`is-size-6 ${(displayProps.anim[0] || displayProps.anim[1]) && 'has-text-white'}`}>
                            {type === 'Map' && prop in store.structs.objects ?
                                <Pointer active={!!displayProps.anim[0]} id={prop} size={displayProps.size} />
                                :
                                <Tooltip overlay={() => (
                                    <div className="has-text-weight-bold">
                                        {type !== 'Set' && <span style={{ fontSize: 9 }}>
                                            {type === 'Map' && prop in store.structs.objects ? store.viz.types[prop] : prop}:{' '}
                                        </span>}
                                        {getVal(prop, true)}
                                    </div >
                                )}>
                                    <span className="prop-name" style={{ fontSize: 12 * ratio }}> {prop.slice(0, 5) + (prop.length > 5 ? '...' : '')}</span>
                                </Tooltip>}
                        </p>
                    </div>}
                    <div className={`column`}>
                        <ArrayChild className={className} objectId={value} ratio={ratio * .5} anim={anim} />
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
                store.structs.switchOff(info, 'get')
                store.structs.switchOff(info, 'set')
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
                        {type === 'Map' ? getVal(prop, true) : String(prop)}:{' '}
                    </span>}
                    {getVal(value, true)}
                </div >
            )}
                placement={'right'}
                trigger={['hover']} visible={visible || hovered} defaultVisible={false} >
                <div className="columns is-paddingless is-multiline">
                    {type !== 'Set' && <div className={`column`}>
                        < p style={{
                            color: (displayProps.anim[0] || displayProps.anim[1]) ? 'white' : store.settings.structColors[type],
                            fontWeight: (displayProps.anim[0] || displayProps.anim[1]) ? 'bold' : 'normal'
                        }}
                            className={`is-size-6 $`}>
                            {type === 'Map' ?
                                getHashVal(prop, { ...displayProps }) :
                                <span className="prop-name" style={{}}>{prop.slice(0, 5)}{(prop.length > 5 ? <span style={{ fontSize: 5 }}>...</span> : '')}</span>}
                        </p>
                    </div>}
                    <div className={`column`}>
                        {getHashVal(value, displayProps)}
                    </div>
                </div>
            </Tooltip>
        </div >
    );


})

export default HashVal;
