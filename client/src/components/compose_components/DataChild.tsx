import React from 'react';
import store from '../../store';
import DataStruct from './DataStruct';
import ArrayStruct from './ArrayStruct';
import HashStruct from './HashStruct';
import { observer } from 'mobx-react';
import LinePointer from './LinePointer';
import genId from '../../utils/genId';
import ArcPointer from './ArcPointer';

type Props = {
    objectId: string
    ratio: number
    prop: string | number
    parent: Viz.Structure
    parentId: string
    isList?: boolean
    idx?: number
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
        const { objectId, ratio, prop, parent, parentId, isList, idx } = this.props
        const pos = store.structs.positions[objectId]

        const info = parent[prop]
        const type = store.viz.types[objectId]
        const arc = pos ? this.renderId !== pos.renderId : false
        const pointerProps = {
            arc,
            get: info.get,
            set: info.set,
            from: parentId,
            to: objectId,
            prop
        }
        if (arc) {
            console.log(pointerProps.from, '>', pointerProps.to)
        }
        let element;
        if (!['Array', 'Object', 'Map', 'Set'].includes(type)) {
            element = <DataStruct idx={idx} isList={isList} renderId={this.renderId} objectId={objectId} ratio={ratio} structure={store.structs.objects[objectId]} />
        } else if (type === 'Array') {
            element = <ArrayStruct objectId={objectId} ratio={ratio * 1.5} pointed={false} structure={store.structs.objects[objectId]} />
        } else if (type === 'Object') {
            element = <HashStruct orientation={'row'} objectId={objectId} ratio={ratio} pointed={false} structure={store.structs.objects[objectId]} />
        } else {
            element = null
        }
        return !arc ? (
            <LinePointer {...pointerProps}>
                {element}
            </LinePointer>
        ) : (
                <ArcPointer {...pointerProps}>
                    {element}
                </ArcPointer>
            )
    }
}

export default DataChild;
