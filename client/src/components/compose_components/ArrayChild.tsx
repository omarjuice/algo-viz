import React, { Component } from 'react';
import ArrayStruct from './ArrayStruct';
import store from '../../store';
import { observer } from 'mobx-react';
import genId from '../../utils/genId';

type Props = {
    className: string
    anim: Viz.anim,
    objectId: string
    ratio: number
}

@observer
class ArrayChild extends Component<Props> {

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
        const { className, anim, objectId, ratio } = this.props
        return (
            <div className={`array-line ${className}`}>
                <ArrayStruct renderId={this.renderId} pointed={!!anim[0]} objectId={objectId} structure={store.structs.objects[objectId]} ratio={(.9) * ratio} />
            </div>
        );
    }
}

export default ArrayChild;
