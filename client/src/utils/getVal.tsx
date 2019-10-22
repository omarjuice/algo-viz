import React from 'react'
import store from "../store";
import Pointer from '../components/compose_components/Pointer';
import ValDisplay from "../components/compose_components/ValDisplay";

const getVal = (value: any, displayProps: Viz.DisplayProps, type: Viz.valType, includePointer = false, isDataDisplay = false) => {
    const { settings: { valueColors: colors } } = store
    if (type === 'null') {
        displayProps.color = displayProps.color || 'transparent';
    } else if (type === 'object') {
        displayProps.color = displayProps.color || store.settings.configColors["Primary Background"]
        if (includePointer) {
            displayProps.component = <Pointer active={!!displayProps.anim[0]} id={value} size={displayProps.size * 3} isInsideDisplay={true} />;
        } else {
            return <Pointer active={!!displayProps.anim[0]} id={value} size={displayProps.size} />;
        }
    } else {
        displayProps.color = displayProps.color || colors[type]
    }
    if (type === 'other') {
        value = store.viz.types[value]
    }
    if (type === 'boolean') {
        displayProps.textDisplay = value ? 'T' : 'F'
    } else if (type === 'string' || type === 'other') {
        if (value.length <= 4) displayProps.textDisplay = value
    } else if (type === 'number') {
        const strVal = String(value)
        let len = strVal.length
        if (strVal[0] === '-')--len
        if (len < 4) displayProps.textDisplay = strVal
    }
    displayProps.isDataDisplay = isDataDisplay
    return <ValDisplay {...displayProps} />

}

export default getVal