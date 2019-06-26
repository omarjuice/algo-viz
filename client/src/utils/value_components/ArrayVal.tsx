import React, { useState } from 'react';
import { getVal } from '..';
import { observer } from 'mobx-react';
import Tooltip from 'rc-tooltip';
import 'rc-tooltip/assets/bootstrap.css'
import store from '../../store';
type ArrayValProps = {
    array: Viz.Structure
    index: number,
    objectId: string
}

type DisplayProps = {
    color: string
    size: number
    anim: 'pop' | 'bounce' | ''
}

const ValDisplay: React.FC<DisplayProps> = ({ color, size, children, anim }) => {
    const base = 30
    return <svg className={anim} height={base * size} width={base * size} viewBox="0 0 100 100" fill={color}>
        <circle cx="50" cy="50" r="50" />
        {children}
    </svg>
}


// const getArrayVal = (value: any) => {
//     if (typeof value === 'boolean') {

//     } else if (typeof value === 'string') {


//     } else if (typeof value === 'number') {

//     }
//     return value
// }

const ArrayVal: React.FC<ArrayValProps> = observer(({ array, index, objectId }) => {
    const [hovered, toggle] = useState(false)
    if (!(index in array)) return null;
    const info = array[index]
    if (store.structs.active) {
        return (
            <div
                onMouseEnter={() => toggle(true)}
                onMouseLeave={() => toggle(false)}
                className={`
        array-val 
        ${info.get && 'get'}
        ${info.set && 'set'}
        ${objectId}
        `}>
                <Tooltip overlay={() => <div>{getVal(info.value)}</div >} placement={((info.get || hovered) && 'top') || 'bottom'} trigger={['hover']} visible={info.get || info.set || hovered} defaultVisible={false} >
                    <ValDisplay anim={(info.set && 'bounce') || (info.get && 'pop') || ''} color={'white'} size={1} />
                </Tooltip>
                {<span className="array-index" style={{ fontSize: 10 }}>{index}</span>}
            </div >
        );
    }
    return null

})

export default ArrayVal;
