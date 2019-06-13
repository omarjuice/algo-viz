import React from 'react'
import store from '../store'
import { observer } from 'mobx-react';


const getVal = (value: any) => {
    if (typeof value === 'boolean') {
        return value.toString()
    } else if (value === null) {
        return 'null'
    } else if (typeof value === 'string') {
        if (value.slice(0, 1) === '_') {
            return store.viz.types[value]
        }
    }
    return value
}

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