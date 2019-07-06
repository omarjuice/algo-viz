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
    const color = 'green'
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
    let main: any = null
    for (const key in structure) {
        const value = structure[key].value
        if (typeof value === 'string' && value in store.viz.objects) {
            childKeys[value] = key
        } else if (!main) {
            main = structure[key]
        }
    }

    const children: React.ReactNode[] = []

    store.structs.children[objectId].forEach(child => {
        children.push(
            <DataChild key={child} parent={structure} objectId={child} ratio={ratio / 2 || (store.structs.children[objectId].size)} prop={childKeys[child]} />
        )
    })

    const anim: Viz.anim = [main.get, main.set]
    const size = Math.min(30, Math.max(width - 1, 1))

    const displayProps: DisplayProps = {
        objectId,
        color: store.settings.structColors[type],
        size,
        anim,
        textDisplay: "",
        textColor: invertColor(store.settings.structColors[type])
    }

    return (
        <div className={'data-struct'} style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
        }} >
            <div> {main ? getDataVal(main.value, displayProps) : null} </div>
            <div style={styles}>
                {children}
            </div>
        </div>
    )
})

export default DataStruct