import React from 'react';
import store from '../../store';
import DataStruct from './DataStruct';
import ArrayStruct from './ArrayStruct';
import HashStruct from './HashStruct';
import { observer } from 'mobx-react';
import LinePointer from './LinePointer';

type Props = {
    objectId: string
    ratio: number
    prop: string | number
    parent: Viz.Structure
    parentId: string
}

class DataChild extends React.Component<Props>{
    render() {
        const { objectId, ratio, prop, parent, parentId } = this.props
        const info = parent[prop]
        const type = store.viz.types[objectId]
        let element;
        if (!['Array', 'Object', 'Map', 'Set'].includes(type)) {
            element = <DataStruct prop={prop} objectId={objectId} ratio={ratio} pointed={false} structure={store.structs.objects[objectId]} />
        } else if (type === 'Array') {
            element = <ArrayStruct objectId={objectId} ratio={ratio} pointed={false} structure={store.structs.objects[objectId]} />
        } else if (type === 'Object') {
            element = <HashStruct orientation={'row'} objectId={objectId} ratio={ratio} pointed={false} structure={store.structs.objects[objectId]} />
        } else {
            element = null
        }
        return (
            <LinePointer get={info.get} set={info.set} from={parentId} to={objectId}>
                {element}
            </LinePointer>
        )
    }
}

export default DataChild;
