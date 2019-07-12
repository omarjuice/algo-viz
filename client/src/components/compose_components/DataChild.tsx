import React from 'react';
import store from '../../store';
import DataStruct from './DataStruct';
import ArrayStruct from './ArrayStruct';
import HashStruct from './HashStruct';
import { observer } from 'mobx-react';
import LinePointer from './LinePointer';
import genId from '../../utils/genId';

type Props = {
    objectId: string
    ratio: number
    prop: string | number
    parent: Viz.Structure
    parentId: string
}

@observer
class DataChild extends React.Component<Props>{
    renderId: string = genId(5)
    componentWillUnmount() {
        const pos = store.structs.positions[this.props.objectId]
        if (pos) {
            if (pos.renderId === this.renderId) {
                delete store.structs.positions[this.props.objectId]
            }
        }
    }
    render() {
        const { objectId, ratio, prop, parent, parentId } = this.props
        const pos = store.structs.positions[objectId]

        const info = parent[prop]
        const type = store.viz.types[objectId]
        let element;
        if (!['Array', 'Object', 'Map', 'Set'].includes(type)) {
            element = <DataStruct renderId={this.renderId} prop={prop} objectId={objectId} ratio={ratio} pointed={false} structure={store.structs.objects[objectId]} />
        } else if (type === 'Array') {
            element = <ArrayStruct objectId={objectId} ratio={ratio} pointed={false} structure={store.structs.objects[objectId]} />
        } else if (type === 'Object') {
            element = <HashStruct orientation={'row'} objectId={objectId} ratio={ratio} pointed={false} structure={store.structs.objects[objectId]} />
        } else {
            element = null
        }
        return (
            <LinePointer arc={pos ? this.renderId !== pos.renderId : false} get={info.get} set={info.set} from={parentId} to={objectId}>
                {element}
            </LinePointer>
        )
    }
}

export default DataChild;
