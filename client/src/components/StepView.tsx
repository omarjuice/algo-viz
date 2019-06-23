import React from 'react'
import store from '../store'
import { observer } from 'mobx-react';
import { getVal } from '../utils'

const StepView: React.FC = observer(() => {
    if (!store.allowRender) return null

    const { step, index } = store.iterator

    return (
        step && <div>
            <span >{index}/{store.viz.steps.length}:</span>
            <span>{step.type}</span>
            <br />
            <span>{getVal(step.value)}</span>
        </div>
    )
})
export default StepView