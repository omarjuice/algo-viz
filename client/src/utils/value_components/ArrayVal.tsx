import React, { useState, useRef, useEffect } from 'react';
import { getVal } from '..';
import { observer } from 'mobx-react';
import Tooltip from 'rc-tooltip';
import 'rc-tooltip/assets/bootstrap.css'
import store from '../../store';
import anime from 'animejs'
type ArrayValProps = {
    array: Viz.Structure
    index: number,
    objectId: string
}
type anim = [boolean, boolean]

type DisplayProps = {
    color: string
    size: number
    anim: anim
}

const ValDisplay: React.FC<DisplayProps> = ({ color, size, children, anim }) => {
    const base = 30
    const ref = useRef(null)
    useEffect(() => {
        if (ref.current) {
            if (anim[0]) {
                anime({
                    targets: ref.current,
                    scale: [1, 1.5, 1],
                    duration: store.structs.updateSpeed,
                    easing: 'easeInCubic'
                })
            }
            if (anim[1]) {
                anime({
                    targets: ref.current,
                    translateY: [0, -50, 0],
                    duration: store.structs.updateSpeed,
                    easing: 'easeInCubic'
                })
            }
        }
    })
    return <svg ref={ref} height={base * size} width={base * size} viewBox="0 0 100 100" fill={color}>
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
    const anim: anim = [info.get, info.set]

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
            <Tooltip overlay={() => <div>{getVal(info.value)}</div >} placement={(info.set && 'bottom') || ((info.get || hovered) && 'top') || 'top'} trigger={['hover']} visible={info.get || info.set || hovered} defaultVisible={false} >
                <ValDisplay anim={anim} color={'white'} size={1} />
            </Tooltip>
            {<span className="array-index" style={{ fontSize: 10 }}>{index}</span>}
        </div >
    );


})

export default ArrayVal;
