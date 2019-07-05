import React from 'react';
import store from '../../store';
import DataStruct from './DataStruct';

type Props = {
    objectId: string
    ratio: number
    prop: string | number
    parent: Viz.Structure
}

const DataChild: React.FC<Props> = ({ objectId, ratio, prop, parent }) => {
    const info = parent[prop]
    const type = store.viz.types[objectId]
    if (!['Array', 'Obejct', 'Map', 'Set'].includes(type)) {
        return <DataStruct objectId={objectId} ratio={ratio} pointed={!!info.get} structure={store.structs.objects[objectId]} />
    } else {
        return null
    }
}

export default DataChild;
