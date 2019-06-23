import React from 'react';
import { observer } from 'mobx-react';
import store from '../store/index';
import Slider, { Handle } from 'rc-slider';
import Tooltip from 'rc-tooltip'
import 'rc-slider/assets/index.css'





const handle = (props: any) => {
    const { value, dragging, index, ...restProps } = props;
    return (
        <Tooltip
            prefixCls="rc-slider-tooltip"
            overlay={value}
            visible={dragging}
            placement="top"
            key={index}
        >
            <Handle value={value} {...restProps} style={{
                borderColor: 'blue',
                height: 14,
                width: 14,
                marginLeft: -5,
                marginTop: -2,
                backgroundColor: 'black'
            }} />
        </Tooltip>
    );
};
const IteratorContol: React.FC = observer(() => {
    const { iterator } = store
    return (
        <div className="container">
            <Slider
                min={-1}
                max={store.viz.steps.length}
                defaultValue={-1}
                value={iterator.handling ? iterator.handler.value : iterator.index}
                onBeforeChange={() => { iterator.beforeChange() }}
                onChange={(e) => iterator.change(e)}
                onAfterChange={() => { iterator.afterChange() }}
                trackStyle={{ backgroundColor: '#A663CC', height: 10 }}
                handle={handle}
                railStyle={{ backgroundColor: '#C2BBF0', height: 10 }}
            />
            <br />

        </div>
    )
})

export default IteratorContol