import React, { useRef, useMemo, ReactNode } from 'react';
import store from '../../store';
import { observer } from 'mobx-react';
import genId from '../../utils/genId';


type DisplayProps = {
    color: string
    size: number
    anim: Viz.anim
    objectId: string
    textDisplay: string | ReactNode
    textColor?: string
    highlight?: boolean
}

const ValDisplay: React.FC<DisplayProps> = observer(({ color, size, anim, objectId, textDisplay, textColor, highlight }) => {
    const ref = useRef(null)
    const gradId = useMemo(() => genId(7), [])
    return <svg
        className="val-display" style={{
            transform: anim[1] ? `translateY(${(-size)}px)` : anim[0] ? `scale(${1.5})` : `scale(${highlight ? String((1.1 / (size / 30))) : '1'})`,
            position: 'relative',
            zIndex: highlight ? 5 : 3,
            transition: `transform ${store.iterator.baseTime * store.settings.speeds['GET'] / store.iterator.speed}ms`
        }} ref={ref} height={size} width={size} viewBox="0 0 100 100" >
        <defs>
            <radialGradient id={gradId} cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
                <stop offset="80%" style={{ stopColor: `${color}`, stopOpacity: 1 }} />
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