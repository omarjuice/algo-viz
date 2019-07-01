import React, { useRef, useEffect } from 'react';
import store from '../../store';
import anime from 'animejs'


type DisplayProps = {
    color: string
    size: number
    anim: Viz.anim
    objectId: string
    textDisplay: string
}

const ArrayValDisplay: React.FC<DisplayProps> = ({ color, size, anim, objectId, textDisplay }) => {
    const ref = useRef(null)
    useEffect(() => {
        if (ref.current) {
            if (anim[0] && !(anim[0] as any instanceof Promise)) {
                const animation = anime({
                    targets: ref.current,
                    scale: [1, 1.75, 1],
                    duration: store.iterator.baseTime * store.settings.speeds['GET'],
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
                    duration: store.iterator.baseTime * store.settings.speeds['SET'],
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
            fill={store.settings.background} fontSize={50} fontWeight={'bold'}
            dominantBaseline="middle" textAnchor="middle" >
            {textDisplay}
        </text>
    </svg>
}

export default ArrayValDisplay