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
    setDisplay: (display: 'row' | 'column') => void
    display: 'row' | 'column'
}
type anim = [boolean | Promise<void>, boolean | Promise<void>]

type DisplayProps = {
    color: string
    size: number
    anim: anim
    objectId: string
    textDisplay: string
    ignore: boolean
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
    if (!displayProps.ignore) {
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
    }
    return <ValDisplay {...displayProps} />
}

const ArrayVal: React.FC<ArrayValProps> = observer(({ array, index, objectId, size, ratio, setDisplay, display }) => {
    const [hovered, toggle] = useState(false)
    if (!(index in array)) return null;
    const info = array[index]
    let value = info.value
    const anim: anim = [info.get, info.set]
    const displayProps: DisplayProps = {
        objectId,
        color: store.globals.colors.other,
        size,
        anim,
        textDisplay: "",
        ignore: false
    }
    if (typeof info.value === 'string') {
        const type = store.viz.types[info.value]
        if (type === 'Array') {
            let flag = false
            // if (store.structs.children.has(objectId)) {


            //     displayProps.color = 'black'
            //     displayProps.ignore = true
            // }
            if (!flag) return (
                <div className="array-line">
                    <ArrayStruct parent={objectId} objectId={info.value} structure={store.structs.objects[info.value]} ratio={(display === 'row' ? .9 : .75) * ratio} />
                </div>
            )

        }
    }

    if (display === 'column') {
        setDisplay('row')
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
            ${!!info.get && 'get'}
            ${!!info.set && 'set'}
            ${objectId}
            `}
            style={{
                margin: '4px 2px',
                height: `${size * 1.5}px`,
            }}
        >
            <Tooltip overlay={() => <div className="has-text-weight-bold">{getVal(info.value)}</div >}
                arrowContent={array['length'].value <= 20 ? undefined : <span className="has-text-white">{index}</span>}
                placement={(!!info.set && 'bottom') || ((!!info.get || hovered) && 'top') || 'top'}
                trigger={['hover']} visible={!!info.get || !!info.set || hovered} defaultVisible={false} >
                {getArrayVal(info.value, displayProps)}
            </Tooltip>
            {array['length'].value < 21 && <span className="array-index" style={{ fontSize: 10 }}>{index}</span>}
        </div >
    );


})

export default ArrayVal;
