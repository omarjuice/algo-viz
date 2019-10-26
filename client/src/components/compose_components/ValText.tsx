import React from 'react';
import store from '../../store';
import Pointer from './Pointer';
import { observer } from 'mobx-react';
import getType from '../../utils/getType';

type Props = {
    value: any,
    type: Viz.valType,
    textOnly?: boolean,
    size?: number
}

const ValText: React.FC<Props> = observer(({ value, type, textOnly = false, size = 30 }) => {
    let color: string;
    if (type === 'null') return null
    if (type === 'object') {
        const objType: string = store.viz.types[value]
        color = store.settings.structSettings[objType].color
        if (!textOnly) {
            return <Pointer size={size} id={value} active={false} />
        } else {
            value = objType
        }
    } else {
        color = store.settings.valueColors[type]
    }
    if (type === 'string') {
        value = `"${value}"`
    }
    if (type === 'func' || type === 'native' || type === 'special' || type === 'other') {
        value = store.viz.types[value]
    }
    if (Array.isArray(value)) {
        const nodes = []
        let i = 0;
        for (const item of value) {
            nodes.push(<ValText value={item} type={getType(item)} textOnly={false} size={size / value.length} />)
            if (i < value.length - 1) {
                nodes.push(',')
            }
            i++
        }
        return <span style={{ color: store.settings.valueColors.other }}>({nodes})</span>
    }
    if (type === 'boolean' && store.language === 'python') {
        value = value ? 'True' : 'False'
    } else {
        value = String(value)
    }


    return <span style={{ color, fontSize: `${(value.length > 20 ? 100 / value.length : 100)}%` }}>{value}</span>

})

export default ValText

