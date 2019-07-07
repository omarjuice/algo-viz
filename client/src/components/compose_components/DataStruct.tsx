import React from 'react';

import store from '../../store';
import DataChild from './DataChild';
import ValDisplay from './ValDisplay';
import { observer } from 'mobx-react';
import invertColor from '../../utils/invertColor';


type Props = {
    structure: Viz.Structure
    objectId: string
    ratio: number
    pointed: boolean
}
type DisplayProps = {
    color: string
    size: number
    anim: Viz.anim
    objectId: string
    textDisplay: string
    textColor?: string
}

const getDataVal = (value: any, displayProps: DisplayProps) => {
    const { settings: { valueColors: colors } } = store
    if (typeof value === 'boolean') {
        displayProps.textDisplay = value ? 'T' : 'F'
        return <ValDisplay {...displayProps} />
    } else if (typeof value === 'string') {
        if (value in store.viz.types) {
            if (value in store.viz.objects) {
                // return <Pointer active={!!displayProps.anim[0]} id={value} color={"white"} size={displayProps.size} />
            }
        } else {
            if (value.length < 4) displayProps.textDisplay = value
        }
        return <ValDisplay {...displayProps} />
    } else if (typeof value === 'number') {
        const strVal = String(value)
        let len = strVal.length
        if (strVal[0] === '-')--len
        if (len < 4) displayProps.textDisplay = strVal
        return <ValDisplay {...displayProps} />
    }

    return <ValDisplay {...displayProps} />
}


const DataStruct: React.FC<Props> = observer(({ structure, objectId, ratio, pointed }) => {
    const type = store.viz.types[objectId]
    const width = store.windowWidth * .5 * ratio
    const color = store.settings.structColors[type]
    const settings = store.settings.structSettings[type]
    const styles: React.CSSProperties = {
        width,
        display: 'flex',
        flexDirection: 'row',
        // justifyContent: 'center',
    }
    // if (pointed || store.structs.activePointers[objectId]) {
    //     styles.boxShadow = `0 0 5px 2.5px ${color}`;
    // }

    const childKeys: { [key: string]: string } = {}


    for (const key in structure) {
        const value = structure[key].value
        if (typeof value === 'string' && value in store.structs.objects) {
            childKeys[value] = key
        }
    }
    const children: ([number, React.ReactNode])[] = []

    const main = structure[settings.main]
    store.structs.children[objectId].forEach(child => {
        const key = childKeys[child]
        const order = settings.order[key]
        console.log(key, order && order.pos)
        children.push(
            [order ? order.pos : Infinity, <DataChild key={child} parent={structure} objectId={child} ratio={ratio / 2 || (store.structs.children[objectId].size)} prop={key} />]
        )
    })

    const anim: Viz.anim = [main && main.get, main && main.set]
    const size = Math.min(30, Math.max(width - 1, 1))
    const displayProps: DisplayProps = {
        objectId,
        color: color,
        size,
        anim,
        textDisplay: "",
        textColor: invertColor(color)
    }

    return (
        <div className={'data-struct'} style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
        }} >
            <div> {getDataVal(main ? main.value : '', displayProps)} </div>
            <div style={styles}>
                {children.map(child => child[1])}
            </div>
        </div>
    )
})

export default DataStruct