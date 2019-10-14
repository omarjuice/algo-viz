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
    display: Viz.displayOrientation
    setChildren: (o: number) => void
}



const ArrayVal: React.FC<Props> = observer(({ array, index, objectId, size, ratio, setChildren }) => {
    const [hovered, toggle] = useState(false)
    const info = array.get(index) || {
        value: null,
        get: false,
        set: false,
    }

    const value = info.value

    const { get, set } = info;
    const className = `${!!info.get && 'get'} ${!!info.set && 'set'} ${objectId}`
    const anim: Viz.anim = useMemo(() => [get, set], [get, set])
    const displayProps: Viz.DisplayProps = {
        objectId,
        color: '',
        size,
        anim,
        textDisplay: "",
    }
    if (typeof value === 'string' && value in store.structs.objects) {
        if (!store.structs.bindings.has(value)) {
            const type = store.viz.types[value];
            const parent = store.structs.pointers.get(value).top;
            if (store.settings.arrayTypes.has(type) && parent && parent.id === objectId && parent.key === index) {
                return (
                    <div className={`array-line ${className}`}>
                        <ArrayChild setChildren={setChildren} className={className} objectId={value} ratio={ratio} anim={anim} />
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
                    <ValText value={value} type={valType} textOnly={true} />
                </div >)}
                placement={(!!info.set && 'bottom') || ((!!info.get || hovered) && 'top') || 'top'}
                trigger={['hover']} visible={store.settings.config.tooltips ? visible || hovered : hovered} defaultVisible={false} >
                {getVal(value, displayProps, valType)}
            </Tooltip>
        </div >
    );


})

export default ArrayVal;
