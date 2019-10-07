import React from 'react';
import { observer, Observer } from 'mobx-react';
import store from '../store/index';
import Slider, { Handle } from 'rc-slider';
import Tooltip from 'rc-tooltip'
import 'rc-slider/assets/index.css'





const handle = (props: any) => {
    const { value, dragging, index, ...restProps } = props;
    return (
        <Tooltip
            prefixCls="rc-slider-tooltip"
            overlay={value + (store.viz.steps[value] ? ': ' + store.viz.steps[value].type : '')}
            visible={dragging}
            placement="top"
            key={index}
        >
            <Observer>
                {() => <Handle value={value} {...restProps} style={{
                    borderColor: store.settings.configColors['Step Slider Handle'],
                    height: 14,
                    width: 14,
                    marginLeft: -5,
                    marginTop: -2,
                    backgroundColor: store.settings.configColors["Primary Background"]
                }} />}
            </Observer>
        </Tooltip>
    );
}
const IteratorContol: React.FC = observer(() => {
    const { iterator, settings } = store
    return (
        <div className="iterator-control">
            <Slider
                min={0}
                max={store.viz.steps.length - 1}
                defaultValue={-1}
                value={iterator.handling ? iterator.handler.value : iterator.index}
                onBeforeChange={() => { iterator.beforeChange() }}
                onChange={(e) => iterator.change(e)}
                onAfterChange={() => { iterator.afterChange() }}
                trackStyle={{
                    backgroundColor: store.viz.steps[store.viz.steps.length - 1].type === 'ERROR' ? '#FF0000' : settings.configColors['Step Slider Track'],
                    height: 10
                }}
                handle={handle}
                railStyle={{
                    backgroundColor: store.viz.steps[store.viz.steps.length - 1].type === 'ERROR' ? '#FF8080' : settings.configColors['Step Slider Rail'],
                    height: 10
                }}
            />
            <br />

        </div>
    )
})

export default IteratorContol