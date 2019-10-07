import React, { useState, useEffect } from 'react';
import store from '../../store';
import { observer } from 'mobx-react';

type Props = {
    active: boolean
    id: string
    size: number
    isInsideDisplay?: boolean
}

const Pointer: React.FC<Props> = observer(({ active, id, size, isInsideDisplay = false }) => {
    const [hovered, toggle] = useState(false)
    const config = store.settings.config
    const isActive = config['Active Pointer on GET'] ? hovered || active : hovered
    useEffect(() => {
        if (!(id in store.structs.objects)) return
        store.structs.activePointers[id] = isActive
        if (isActive) {
            if (!store.structs.positions[id]) {
                store.structs.bindings.add(id)
            }
        }
    }, [isActive, id])
    const type = store.viz.types[id]
    const { color } = store.settings.structSettings[type]
    const strokeWidth = isInsideDisplay ? size / 2 : size * 2
    return <svg width={size} height={size}
        onMouseEnter={() => {
            toggle(true)
        }}
        onMouseLeave={() => {
            toggle(false)
        }}
        viewBox="0 0 600 600" preserveAspectRatio="xMidYMid meet" >

        <path d="M39.54545454545544,299l295.4545454545455,291.8181818181881l196.9999999999991,-478.8181818181881l-489.72727272727184,185.18181818181722Z"
            style={{ fill: isActive ? color : "none", stroke: color, strokeWidth }} />
    </svg>
}
)


export default Pointer