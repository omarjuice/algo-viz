import React from 'react';
import { observer } from 'mobx-react';
import store from '../../store';


type Props = {
    from: string
    to: string
    get: boolean | Promise<void>
    set: boolean | Promise<void>
}

const ArcPointer: React.FC<Props> = observer(({ from, to, children, get, set }) => {
    const fromCoords = store.structs.positions[from]
    const toCoords = store.structs.positions[to]
    if (!fromCoords || !toCoords) {
        return (
            <>
                {children}
            </>
        );
    } else {
        let width = Math.abs(fromCoords.x - toCoords.x)
        let height = Math.abs(fromCoords.y - toCoords.y)
        const shiftLeft = fromCoords.x > toCoords.x
        const shiftTop = fromCoords.y < toCoords.y
        let left = shiftLeft ? fromCoords.x - width : fromCoords.x
        let top = shiftTop ? fromCoords.y : fromCoords.y - height
        const noWidth = width < 1
        const noHeight = height < 1
        if (noWidth) {
            width = height
            left -= 2.5
        }
        if (noHeight) {
            height = width


            top -= 2.5
        }
        const lineCoords = {
            x1: shiftLeft ? width : 0,
            y1: shiftTop ? 0 : height,
            x2: shiftLeft ? 0 : width,
            y2: shiftTop ? height : 0
        }
        if (noHeight) {
            lineCoords.y1 = 2.5
            lineCoords.y2 = 2.5
        }
        if (noWidth) {
            lineCoords.x1 = 2.5
            lineCoords.x2 = 2.5
        }

        const lineStyle = { stroke: get ? 'green' : set ? 'purple' : 'white', strokeWidth: (get || set) ? '3px' : '1px' }
        const circleCoords = {
            cx: noWidth ? lineCoords.x2 : Math.abs(lineCoords.x2 - toCoords.radius),
            cy: noHeight ? lineCoords.y2 : Math.abs(lineCoords.y2 - toCoords.radius),
            r: toCoords.radius / 5
        }
        let path: any;
        path = {}
        // circleCoords.cy += toCoords.radius - 1
        // circleCoords.cx -= toCoords.radius
        if (noHeight) {
            circleCoords.cy = lineCoords.y2 + toCoords.radius
            circleCoords.cx = lineCoords.x2
            path.pointA = {
                x: lineCoords.x1,
                y: lineCoords.y1 + fromCoords.radius - 1
            }
            path.pointB = {
                x: lineCoords.x2,
                y: lineCoords.y2 + toCoords.radius - 1
            }
            path.control = {
                x: width / 2,
                y: height
            }
        } else if (noWidth) {
            circleCoords.cx = lineCoords.x2 + toCoords.radius
            circleCoords.cy = lineCoords.y2
            path.pointA = {
                x: lineCoords.x1 + fromCoords.radius - 1,
                y: lineCoords.y1
            }
            path.pointB = {
                x: lineCoords.x2 + toCoords.radius - 1,
                y: lineCoords.y2
            }
            path.control = {
                x: width,
                y: height / 2
            }
        } else {
            path = null
        }

        return (
            <div>
                <svg style={{ position: 'absolute', top, left, zIndex: 0 }} height={height} width={width} viewBox={`0 0 ${width} ${height}`}>


                    {path && <path d={`M ${path.pointA.x} ${path.pointA.y} Q ${path.control.x} ${path.control.y} ${path.pointB.x} ${path.pointB.y}`} style={lineStyle} fill="transparent" />}
                    <circle {...circleCoords} fill={lineStyle.stroke} />


                </svg>
                {children}
            </div>
        )
    }


})

export default ArcPointer;
