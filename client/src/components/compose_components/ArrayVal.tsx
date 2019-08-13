import React, { useState, useMemo } from 'react';
import ValText from './ValText';
import { observer } from 'mobx-react';
import Tooltip from 'rc-tooltip';
import 'rc-tooltip/assets/bootstrap.css'
import store from '../../store';

import ArrayChild from './ArrayChild';
import getType from '../../utils/getType'
import getVal from '../../utils/getVal';
type Props = {
    array: Viz.Structure
    index: number
    objectId: string
    size: number
    ratio: number
    display: 'row' | 'column'
}



const ArrayVal: React.FC<Props> = observer(({ array, index, objectId, size, ratio }) => {
    const [hovered, toggle] = useState(false)
    const info = array.get(index) || {
        value: null,
        get: false,
        set: false,
    }
    let value = info.value
    const { get, set } = info;
    const className = `${!!info.get && 'get'} ${!!info.set && 'set'} ${objectId}`
    const anim: Viz.anim = useMemo(() => [get, set], [get, set])
    const displayProps: Viz.DisplayProps = {
        objectId,
        color: store.settings.valueColors.other,
        size,
        anim,
        textDisplay: "",
    }
    if (typeof value === 'string' && value in store.structs.objects) {
        const parents = store.structs.parents[value]
        let flag = false
        const type = store.viz.types[value]
        if (type !== 'Array') flag = true
        if (store.structs.bindings.has(value)) flag = true
        if (!flag && parents) {
            if (!parents.has(objectId)) flag = true
            else {
                const pointers = store.structs.pointers.get(value)
                if (pointers) {
                    const refs = pointers.get(objectId)
                    if (refs[0] !== index) {
                        flag = true
                    }
                }
            }
        }
        if (!flag) {
            return (
                <div className={`array-line ${className}`}>
                    <ArrayChild className={className} objectId={value} ratio={ratio} anim={anim} />
                </div>
            )
        }
    }
    const style: React.CSSProperties = {
        margin: `4px ${size / 5}px`,
        height: `${Math.max(size * 1.5)}px`,
    }
    const visible = (!!info.get || !!info.set)
    const valType = getType(value)
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
            array-val 
            ${className}
                `}
            style={style}
        >
            <Tooltip overlay={() => (
                <div className="has-text-weight-bold">
                    <span style={{ fontSize: 9 }}> {index}:{' '}</span>
                    <ValText value={value} type={valType} />
                </div >)}
                placement={(!!info.set && 'bottom') || ((!!info.get || hovered) && 'top') || 'top'}
                trigger={['hover']} visible={visible || hovered} defaultVisible={false} >
                {getVal(value, displayProps, valType)}
            </Tooltip>
        </div >
    );


})

export default ArrayVal;
