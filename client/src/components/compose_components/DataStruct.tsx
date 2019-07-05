import React from 'react';
import ArrayVal from './ArrayVal';
import { observer } from 'mobx-react';
import store from '../../store';
import DataChild from './DataChild';


type Props = {
    structure: Viz.Structure
    objectId: string
    ratio: number
    pointed: boolean
}





const DataStruct: React.FC<Props> = ({ structure, objectId, ratio, pointed }) => {
    const type = store.viz.types[objectId]
    const width = store.windowWidth * .5 * ratio
    console.log(ratio);
    const color = 'green'
    const styles: React.CSSProperties = {
        width,
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'center',
    }
    if (pointed || store.structs.activePointers[objectId]) {
        styles.boxShadow = `0 0 5px 2.5px ${color}`;
    }

    const childKeys: { [key: string]: string } = {}
    for (const key in structure) {
        const value = structure[key].value
        if (typeof value === 'string' && value in store.viz.objects) {
            childKeys[value] = key
        }
    }

    const children: React.ReactNode[] = []

    store.structs.children[objectId].forEach(child => {
        children.push(
            <DataChild parent={structure} objectId={child} ratio={ratio / store.structs.children[objectId].size} prop={childKeys[child]} />
        )
    })
    return (
        <div className={'data-struct'} style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
        }} >
            <div> {store.viz.types[objectId]}</div>
            <div style={styles}>
                {children}
            </div>
        </div>
    )
}

export default DataStruct