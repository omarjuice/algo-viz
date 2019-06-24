import React from 'react'
import store from '../store'
import { observer } from 'mobx-react';
import { getVal } from '../utils'

const StepView: React.FC = observer(() => {
    if (!store.allowRender) return null

    const { step, index } = store.iterator

    return (
        step && <div className="step-view">
            <span >{index}/{store.viz.steps.length - 1}:</span>
            <span>{step.type}</span>
            <div >
                {store.code.start ? (
                    <>
                        <span className={`has-text-success`} style={{ fontSize: Math.min(900 / store.code.expression.length, 16) }}>
                            {store.code.expression}
                        </span>
                        {' '}={' '}
                        <span className="has-text-primary is-size-5">
                            {getVal(store.iterator.step.value)}
                        </span>
                    </>
                ) : null}
            </div>
        </div>
    )
})
export default StepView