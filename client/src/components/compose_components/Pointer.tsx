import React, { useState, useEffect } from 'react';
import store from '../../store';
import { observer } from 'mobx-react';

type Props = {
    active: boolean
    id: string
    size: number

}

const Pointer: React.FC<Props> = observer(({ active, id, size }) => {
    const [hovered, toggle] = useState(false)
    const isActive = hovered || active
    useEffect(() => {
        store.structs.activePointers[id] = isActive
        let flag = false
        if (isActive) {
            if (!store.structs.positions[id]) {
                store.structs.bindings.add(id)
                flag = true
            }
        }

        // return () => {
        //     if (flag) {
        //         store.structs.bindings.delete(id)
        //     }
        // }
    }, [isActive, id])
    const type = store.viz.types[id]
    const color = store.settings.structColors[type]
    return <svg width={size} height={size}
        onMouseEnter={() => {
            toggle(true)
            // store.structs.activePointers[id] = true
        }}
        onMouseLeave={() => {
            toggle(false)
            // store.structs.activePointers[id] = false
        }}
        viewBox="0 0 600 600" preserveAspectRatio="xMidYMid meet" >

        <path d="M4.5454545454554385,300l295.45454545454555,291.81818181818824l289.09090909090895,-580.9090909090946l-581.8181818181818,287.2727272727236Z"
            style={{ fill: isActive ? color : "none", stroke: color, strokeWidth: size * 2 }} />
    </svg>
}
)


export default Pointer