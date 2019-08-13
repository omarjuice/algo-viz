import React, { useRef, useMemo, ReactNode, useState, useEffect } from 'react';
import store from '../../store';
import { observer } from 'mobx-react';
import genId from '../../utils/genId';



const ValDisplay: React.FC<Viz.DisplayProps> = observer(({ color, size, anim, textDisplay, textColor, highlight, component }) => {
    const [state, setState] = useState([false, false])
    const [text, setText] = useState(null)
    const animation = useRef(null)
    const timeout = useRef(null)
    const gradId = useMemo(() => genId(7), [])

    useEffect(() => {

        if (anim !== animation.current) {
            animation.current = anim
            setState(anim)
            clearTimeout(timeout.current)
            timeout.current = setTimeout(() => {
                setState([false, false])
            }, store.iterator.getSpeed('GET'))

        }
        if (textDisplay !== text) {
            setTimeout(() => {
                setText(textDisplay)
            }, text === null ? 0 : store.iterator.getSpeed('SET'))
        }
    }, [anim, textDisplay, text])
    return <svg
        className="val-display" style={{
            transform:
                state[1] ?
                    `rotateX(180deg)`
                    : state[0] ? `scale(${1.5})`
                        : highlight ?
                            `scale(1.1)` :
                            `scale(1)`,
            position: 'relative',
            zIndex: highlight ? 5 : 3,
            transition: `transform ${store.iterator.getSpeed('GET')}ms`
        }} height={size} width={size} viewBox="0 0 100 100" >
        <defs>
            <radialGradient id={gradId} cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
                <stop offset="80%" style={{ stopColor: `${color}`, stopOpacity: 1 }} />
                <stop offset="100%" style={{ stopColor: `white`, stopOpacity: 1 }} />
            </radialGradient>
        </defs>
        <circle cx="50" cy="50" r="50" fill={highlight ? `url(#${gradId})` : color} stroke={color} />
        {component || <text x={50} y={50}
            fill={textColor || store.settings.background} fontSize={50} fontWeight={'bold'}
            dominantBaseline="middle" textAnchor="middle" >
            {text}
        </text>}
    </svg>
})

export default ValDisplay