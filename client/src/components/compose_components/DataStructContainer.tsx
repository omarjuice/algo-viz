import React, { Component } from 'react';
import store from '../../store';
import DataStruct from './DataStruct';
import { observer } from 'mobx-react';


interface Props {
    id: string
    idx: number
    heightMultiple: number
}

interface State {
    depthMultiplier: number
}


@observer
class DataStructContainer extends Component<Props, State> {
    depths: number[] = [1]
    state = {
        depthMultiplier: 1
    }

    setDepth = (d: number, val: number) => {
        if (!(d in this.depths)) {
            this.depths[d] = 0;
        }
        this.depths[d] += val
        if (this.depths[d] === 0) {
            while (this.depths.length > d) {
                this.depths.pop()
            }
        }
        const multiple = ((this.depths.length > 10 ? .5 : .7) ** Math.floor((this.depths.length - 1) / (5 * this.props.heightMultiple)));
        const depthMultiplier = 1 * (multiple)
        if (depthMultiplier !== this.state.depthMultiplier) {
            this.setState({ depthMultiplier })
        }
    }
    componentDidUpdate(prevProps: Props) {
        if (prevProps.heightMultiple !== this.props.heightMultiple) {
            this.setDepth(0, 0)
        }
    }

    render() {
        const { id, idx } = this.props
        const { depthMultiplier } = this.state
        const type = store.viz.types[id];
        const settings = store.settings.structSettings[type]
        const numChildren = settings && settings.numChildren
        return (
            <div style={{ overflow: 'visible', display: numChildren === 1 ? 'block' : 'inline-flex' }}>
                <DataStruct depthMultiplier={numChildren === 1 ? Math.min(depthMultiplier * 1.4, 1) : depthMultiplier} setDepth={this.setDepth} depth={0} idx={idx} key={id} ratio={1} structure={store.structs.objects[id]} objectId={id} isList={numChildren === 1} />
            </div>
        )

    }
}

export default DataStructContainer;
