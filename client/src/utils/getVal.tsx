import React from 'react'
import store from "../store";
import Pointer from '../components/compose_components/Pointer';
import ValDisplay from "../components/compose_components/ValDisplay";

const getVal = (value: any, displayProps: Viz.DisplayProps, type: Viz.valType) => {
    const { settings: { valueColors: colors } } = store
    if (type === 'null') {
        displayProps.color = store.settings.background
    } else if (type === 'object') {
        return <Pointer active={!!displayProps.anim[0]} id={value} size={displayProps.size} />
    } else {
        displayProps.color = colors[type]
    }

    if (type === 'boolean') {
        displayProps.textDisplay = value ? 'T' : 'F'
    } else if (type === 'string') {
        displayProps.color = colors.string
        if (value.length <= 4) displayProps.textDisplay = value
    } else if (type === 'number') {
        const strVal = String(value)
        let len = strVal.length
        if (strVal[0] === '-')--len
        if (len < 4) displayProps.textDisplay = strVal
    }

    return <ValDisplay {...displayProps} />

}

export default getVal