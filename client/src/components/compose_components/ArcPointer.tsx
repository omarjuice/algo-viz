import React, { useRef, useEffect } from 'react';
import { observer } from 'mobx-react';
import store from '../../store';
import { toJS } from 'mobx';
// import Tooltip from 'rc-tooltip';

type Props = {
    from: string
    to: string
    get: boolean | Promise<void>
    set: boolean | Promise<void>
    prop: string | number
}
type coords = {
    x: number
    y: number
}
type path = {
    pointA?: coords
    pointB?: coords
    control?: coords
}

const ArcPointer: React.FC<Props> = observer(({ from, to, children, get, set, prop }) => {
    const fromCoords = store.structs.positions[from]
    const toCoords = store.structs.positions[to]
    const active = store.structs.activePointers[from]
    const willRender = fromCoords && toCoords
    const timeout = useRef(null)
    useEffect(() => {
        if (willRender) {
            if (active) {
                timeout.current = setTimeout(() => {
                    store.structs.activePointers[to] = true
                }, 300)
            } else {
                if (timeout.current) clearTimeout(timeout.current)
                store.structs.activePointers[to] = false
            }
        }
    }, [active, to, willRender])

    if (!willRender) {
        return (
            <>
                {children}
            </>
        );
    } else {

        const active = store.structs.activePointers[from]
        let width = Math.abs(fromCoords.x - toCoords.x)
        let height = Math.abs(fromCoords.y - toCoords.y)
        const noWidth = width < 1
        const noHeight = height < 1
        let shiftLeft = fromCoords.x > toCoords.x
        let shiftTop = fromCoords.y < toCoords.y
        if (noHeight) {
            if (toCoords.x > fromCoords.x) {
                shiftTop = true

            } else {
                shiftTop = false
            }
            height = width / 2

        }
        if (noWidth) {
            if (toCoords.y > fromCoords.y) {
                shiftLeft = true
            } else {
                shiftLeft = false
            }
            width = height / 2
        }

        let left = shiftLeft ? fromCoords.x - width : fromCoords.x
        let top = shiftTop ? fromCoords.y : fromCoords.y - height
        const lineCoords = {
            x1: shiftLeft ? width : 0,
            y1: shiftTop ? 0 : height,
            x2: shiftLeft ? 0 : width,
            y2: shiftTop ? height : 0
        }
        if (noHeight) {
            lineCoords.y1 = !shiftTop ? height : 0
            lineCoords.y2 = !shiftTop ? height : 0
        }
        if (noWidth) {
            lineCoords.x1 = shiftLeft ? width : 0
            lineCoords.x2 = shiftLeft ? width : 0
        }



        const path: path = {};

        if (noHeight) {
            const negate = shiftTop ? 1 : -1
            path.pointA = {
                x: lineCoords.x1,
                y: lineCoords.y1 + negate * fromCoords.radius / 2
            }
            path.pointB = {
                x: lineCoords.x2,
                y: lineCoords.y1 + negate * toCoords.radius / 2
            }
            path.control = {
                x: width / 2,
                y: !shiftTop ? 0 : height
            }
        } else if (noWidth) {
            const negate = shiftLeft ? 1 : -1
            path.pointA = {
                x: lineCoords.x1 - negate * fromCoords.radius / 2,
                y: lineCoords.y1
            }
            path.pointB = {
                x: lineCoords.x2 - negate * toCoords.radius / 2,
                y: lineCoords.y2
            }
            path.control = {
                x: shiftLeft ? 0 : width,
                y: height / 2
            }
        } else {
            path.pointA = {
                x: lineCoords.x1,
                y: lineCoords.y1
            }
            path.pointB = {
                x: lineCoords.x2,
                y: lineCoords.y2
            }
            path.control = {
                x: !shiftLeft ? width : 0,
                y: !shiftTop ? height : 0
            }
        }

        let d: string;
        if (path.pointA) {
            d = `M ${path.pointA.x} ${path.pointA.y} Q ${path.control.x} ${path.control.y} ${path.pointB.x} ${path.pointB.y}`
        }
        const isActive = (get || set || active)
        const lineStyle: React.CSSProperties = {
            stroke: get ? '#23D160' : set ? '#A663CC' : 'white',
            strokeWidth: isActive ? '3px' : '1px',
            strokeDasharray: '1000',
            strokeDashoffset: isActive ? '0' : '1000',
            transition: 'stroke-dashoffset 2s',
            fill: 'transparent'

        }
        return (
            <div>
                <svg style={{ position: 'absolute', top, left, zIndex: 0 }} height={height} width={width} viewBox={`0 0 ${width} ${height}`}>

                    {d && <path d={d} strokeDashoffset={toCoords.radius} stroke="white" strokeWidth={1} fill="transparent" />}
                    {d && <path d={d} style={lineStyle} />}
                </svg>
                {children}
            </div>
        )
    }


})

export default ArcPointer;
