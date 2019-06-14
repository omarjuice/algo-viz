import React from 'react'
import store from '../store'
import { observer } from 'mobx-react';
import { getVal } from '../utils'

const StepView: React.FC = observer(() => {

    const { step, index } = store.iterator

    return (
        step && <div>
            <span >{index}:</span>
            <span>{step.type}</span>
            <br />
            <span>{getVal(step.value)}</span>
        </div>
    )
})
export default StepView