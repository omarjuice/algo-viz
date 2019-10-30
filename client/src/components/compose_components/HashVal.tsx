import React, { useState, useMemo } from 'react';
import ValText from './ValText';
import { observer } from 'mobx-react';
import Tooltip from 'rc-tooltip';
import 'rc-tooltip/assets/bootstrap.css'
import store from '../../store';
import ArrayChild from './ArrayChild';
import getType from '../../utils/getType';
import getVal from '../../utils/getVal';
type ValProps = {
    object: Viz.Structure
    prop: string
    objectId: string
    size: number
    ratio: number
}


type DisplayProps = Viz.DisplayProps & { type: string }


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
        color: '',
        size,
        anim,
        textDisplay: "",
        type
    }
    const valType = getType(value)
    const visible = (!!info.get || !!info.set)
    if (typeof value === 'string' && value in store.structs.objects && store.settings.arrayTypes.has(store.viz.types[value])) {
        const parent = store.structs.pointers.get(value).top

        if (parent && parent.id === objectId && parent.key === prop) {
            return (
                <div onMouseEnter={() => {
                    toggle(true)
                    store.structs.switchOff(info, 'get')
                    store.structs.switchOff(info, 'set')
                }}
                    onMouseLeave={() => {
                        toggle(false)
                    }}
                    className={`columns is-paddingless is-multiline ${className}`}>
                    {!store.settings.setTypes.has(type) && <div className={`column ${store.settings.mapTypes.has(type) && 'has-text-right'}`}>
                        <p className={`is-size-6 ${(displayProps.anim[0] || displayProps.anim[1]) && 'has-text-white'}`}>

                            <Tooltip

                                placement={'left'}
                                defaultVisible={true}
                                trigger={['hover']} visible={store.settings.config.tooltips ? visible || hovered : hovered}
                                overlay={() => (
                                    <div className="has-text-weight-bold">
                                        {!store.settings.setTypes.has(type) && <span style={{ fontSize: 9 }}>
                                            {store.settings.mapTypes.has(type) ? <ValText value={prop} type={getType(prop)} /> : String(prop)}:{' '}
                                        </span>}
                                        <ValText value={value} type={valType} textOnly={true} />
                                    </div >
                                )}>
                                {store.settings.mapTypes.has(type) ?
                                    getVal(prop, { ...displayProps }, getType(prop)) :
                                    <span className="prop-name" style={{}}>{(prop).slice(0, 5)}{((prop).length > 5 ? <span style={{ fontSize: 5 }}>...</span> : '')}</span>}
                            </Tooltip>

                        </p>
                    </div>}
                    <div className={`column`}>
                        <ArrayChild setChildren={null} className={className} objectId={value} ratio={ratio * .5} anim={anim} />
                    </div>
                </div>

            )
        }
    }

    const style: React.CSSProperties = {
        margin: `${size / 5}px 0px`,
        height: `${Math.max(size * 1.5)}px`,
    }
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
            hash-val ${className}
                `}
            style={style}
        >
            <Tooltip overlay={() => (
                <div className="has-text-weight-bold">
                    {!store.settings.setTypes.has(type) && <span style={{ fontSize: 9 }}>
                        {store.settings.mapTypes.has(type) ? <ValText textOnly={true} value={prop} type={getType(prop)} /> : String(prop)}:{' '}
                    </span>}
                    <ValText value={value} type={valType} textOnly={true} />
                </div >
            )}
                placement={'right'}
                trigger={['hover']} visible={store.settings.config.tooltips ? visible || hovered : hovered} defaultVisible={false} >
                <div style={{ overflowX: 'visible' }} className="columns is-paddingless is-multiline">
                    {!store.settings.setTypes.has(type) &&
                        <div style={{ overflowX: 'visible' }} className={`column ${store.settings.mapTypes.has(type) ? 'has-text-right' : 'has-text-centered'}`}>
                            < p style={{
                                color: (displayProps.anim[0] || displayProps.anim[1]) ? 'white' : store.settings.structSettings[type].color,
                                fontWeight: (displayProps.anim[0] || displayProps.anim[1]) ? 'bold' : 'normal'
                            }}
                                className={`is-size-6`}>
                                {store.settings.mapTypes.has(type) ?
                                    getVal(prop, { ...displayProps }, getType(prop)) :
                                    <span className="prop-name" style={{}}>{(prop).slice(0, 5)}{((prop).length > 5 ? <span style={{ fontSize: 5 }}>...</span> : '')}</span>}
                            </p>
                        </div>
                    }
                    <div style={{ overflowX: 'visible' }} className={`column ${store.settings.mapTypes.has(type) ? 'has-text-left' : store.settings.setTypes.has(type) ? 'has-text-centered' : ''}`}>
                        {getVal(value, displayProps, valType)}
                    </div>
                </div>
            </Tooltip>
        </div >
    );


})

export default HashVal;
