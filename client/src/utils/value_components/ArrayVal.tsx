import React, { useState, useRef, useEffect } from 'react';
import { getVal } from '..';
import { observer } from 'mobx-react';
import Tooltip from 'rc-tooltip';
import 'rc-tooltip/assets/bootstrap.css'
import store from '../../store';
import anime from 'animejs'
import ArrayStruct from './ArrayStruct';
type ArrayValProps = {
    array: Viz.Structure
    index: number
    objectId: string
    size: number
    ratio: number
    display: 'row' | 'column'
}
type anim = [boolean | Promise<void>, boolean | Promise<void>]

type DisplayProps = {
    color: string
    size: number
    anim: anim
    objectId: string
    textDisplay: string
}

const ValDisplay: React.FC<DisplayProps> = ({ color, size, anim, objectId, textDisplay }) => {
    const ref = useRef(null)
    useEffect(() => {
        if (ref.current) {
            if (anim[0] && !(anim[0] as any instanceof Promise)) {
                const animation = anime({
                    targets: ref.current,
                    scale: [1, 1.5, 1],
                    duration: store.structs.updateSpeed,
                    easing: 'easeInCubic'
                }).finished
                if (store.structs.gets[objectId]) {
                    store.structs.gets[objectId].get = animation
                }
            }
            if (anim[1] && !(anim[1] as any instanceof Promise)) {
                const animation = anime({
                    targets: ref.current,
                    translateY: [-1 * size, size / 2, 0],
                    duration: store.structs.updateSpeed,
                    elasticity: 500,
                    easing: 'easeInCubic'
                }).finished
                if (store.structs.sets[objectId]) {
                    store.structs.sets[objectId].set = animation
                }
            }
        }
    })
    return <svg ref={ref} height={size} width={size} viewBox="0 0 100 100" >
        <circle cx="50" cy="50" r="50" fill={color} stroke={color} />
        <text x={50} y={50}
            fill={store.globals.background} fontSize={50} fontWeight={'bold'}
            dominantBaseline="middle" textAnchor="middle" >
            {textDisplay}
        </text>
    </svg>
}


const getArrayVal = (value: any, displayProps: DisplayProps) => {
    const { globals: { colors } } = store
    if (typeof value === 'boolean') {
        displayProps.color = colors.boolean
        displayProps.textDisplay = value ? 'T' : 'F'
        return <ValDisplay {...displayProps} />
    } else if (typeof value === 'string') {
        if (value in store.viz.types) {
            if (store.viz.types[value] === '<empty>') {
                displayProps.color = store.globals.background
            } else {
                displayProps.color = colors.special
            }

        } else {
            displayProps.color = colors.string
            if (value.length < 4) displayProps.textDisplay = value
        }
        return <ValDisplay {...displayProps} />
    } else if (typeof value === 'number') {
        displayProps.color = colors.number
        const strVal = String(value)
        let len = strVal.length
        if (strVal[0] === '-')--len
        if (len < 3) displayProps.textDisplay = strVal
        return <ValDisplay {...displayProps} />
    }

    return <ValDisplay {...displayProps} />
}

const ArrayVal: React.FC<ArrayValProps> = observer(({ array, index, objectId, size, ratio }) => {
    const [hovered, toggle] = useState(false)
    if (!(index in array)) return null;
    const info = array[index]
    let value = info.value
    const className = `${!!info.get && 'get'} ${!!info.set && 'set'} ${objectId}`
    const anim: anim = [info.get, info.set]
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
            if (flag) {
                return <div>REF</div>
            } else {

                return (
                    <div className={`array-line ${className}`}>
                        <ArrayStruct objectId={value} structure={store.structs.objects[value]} ratio={(.9) * ratio} />
                    </div>
                )
            }



        }
    }
    const style: React.CSSProperties = {
        margin: `4px ${size / 5}px`,
        height: `${Math.max(size * 1.5)}px`,
    }


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
                    {getVal(value)}
                </div >)}
                placement={(!!info.set && 'bottom') || ((!!info.get || hovered) && 'top') || 'top'}
                trigger={['hover']} visible={!!info.get || !!info.set || hovered} defaultVisible={false} >
                {getArrayVal(value, displayProps)}
            </Tooltip>
        </div >
    );


})

export default ArrayVal;
