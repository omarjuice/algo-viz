import React, { useRef, useEffect, useState } from 'react';
import store from '../../store';
import anime from 'animejs'
import { observer } from 'mobx-react';


type DisplayProps = {
    color: string
    size: number
    anim: Viz.anim
    objectId: string
    textDisplay: string
    textColor?: string
    highlight?: boolean
}

const ValDisplay: React.FC<DisplayProps> = observer(({ color, size, anim, objectId, textDisplay, textColor, highlight }) => {
    const ref = useRef(null)
    useEffect(() => {
        if (ref.current) {
            if (anim[0] && !(anim[0] as boolean | Promise<void> instanceof Promise)) {
                const animation = anime({
                    targets: ref.current,
                    translateY: [0],
                    scale: [1, 1.75, 1],
                    duration: store.iterator.baseTime * store.settings.speeds['GET'] / store.iterator.speed,
                    easing: 'easeInCubic'
                }).finished
                if (store.structs.gets[objectId]) {
                    store.structs.gets[objectId].get = animation
                }
            }
            if (anim[1] && !(anim[1] as boolean | Promise<void> instanceof Promise)) {
                const animation = anime({
                    targets: ref.current,
                    translateY: [-1 * size, size / 2, 0],
                    scale: [1],
                    duration: store.iterator.baseTime * store.settings.speeds['SET'] / store.iterator.speed,
                    elasticity: 500,
                    easing: 'easeInCubic'
                }).finished
                if (store.structs.sets[objectId]) {
                    store.structs.sets[objectId].set = animation
                }
            }
        }
    })
    const gradId = Math.random().toString()
    return <svg

        className="val-display" style={{
            transform: `scale(${highlight ? String(1.5 * (1 / (size / 30))) : '1'})`,
            position: 'relative',
            zIndex: highlight ? 5 : 3
        }} ref={ref} height={size} width={size} viewBox="0 0 100 100" >
        <defs>
            <radialGradient id={gradId} cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
                <stop offset="90%" style={{ stopColor: `${color}`, stopOpacity: 1 }} />
                <stop offset="100%" style={{ stopColor: `white`, stopOpacity: 1 }} />
            </radialGradient>
        </defs>
        <circle cx="50" cy="50" r="50" fill={highlight ? `url(#${gradId})` : color} stroke={color} />
        <text x={50} y={50}
            fill={textColor || store.settings.background} fontSize={50} fontWeight={'bold'}
            dominantBaseline="middle" textAnchor="middle" >
            {textDisplay}
        </text>
    </svg>
})

export default ValDisplay