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
    setChildren: ((n: number) => void) | null
}

@observer
class ArrayChild extends Component<Props> {

    renderId: string = genId(5)

    componentDidMount() {
        this.props.setChildren(1)
    }
    componentWillUnmount() {
        const pos = store.structs.positions[this.props.objectId]
        if (pos) {
            if (pos.renderId === this.renderId) {
                delete store.structs.positions[this.props.objectId]
            }
        }
        if (this.props.setChildren) {
            this.props.setChildren(-1)
        }
    }
    render() {
        const { anim, objectId, ratio } = this.props
        return (
            <ArrayStruct renderId={this.renderId} pointed={!!anim[0]} objectId={objectId} structure={store.structs.objects[objectId]} ratio={(.9) * ratio} />
        );
    }
}

export default ArrayChild;
