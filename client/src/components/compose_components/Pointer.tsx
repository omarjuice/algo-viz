import React, { useState, useEffect } from 'react';
import store from '../../store';

type Props = {
    active: boolean
    id: string
    color: string
    size: number

}

const Pointer: React.FC<Props> = ({ active, id, color, size }) => {
    const [hovered, toggle] = useState(false)
    useEffect(() => {
        store.structs.activePointers[id] = hovered || active
    })
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
            style={{ fill: hovered || active ? color : "none", stroke: color, strokeWidth: size * 2 }} id="e1_path" />
    </svg>
}



export default Pointer