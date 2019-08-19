import React, { useState } from 'react'
import store from '../store'
import { observer } from 'mobx-react';
import ValText from './compose_components/ValText'
import getType from '../utils/getType';

const StepView: React.FC = observer(() => {

    const [error, toggleError] = useState(false)
    if (!store.allowRender) return null

    const { step, index } = store.iterator
    const lastIdx = store.viz.steps.length - 1
    const last = store.viz.steps[store.viz.steps.length - 1]
    const errorExists = last.type === 'ERROR'

    const style: React.CSSProperties = {
        color: store.settings.configColors['Step Type']
    }
    return (
        step && <div className="step-view">
            {
                errorExists && lastIdx !== index &&
                <button onClick={() => toggleError(!error)}
                    className="button is-small is-rounded is-danger has-text-weight-bold">
                    {error ? 'Hide' :
                        <figure style={{ marginTop: '-3px' }} onClick={() => toggleError(!error)} className="image is-4by4">
                            <img src={process.env.PUBLIC_URL + '/baseline-error-24px.svg'} alt="" />
                        </figure>
                    }
                </button>

            }
            {' '}
            <span style={style}>{index}/{store.viz.steps.length - 1}:</span>
            <span style={style}>{step.type}</span>

            {!error && !(errorExists && index === store.viz.steps.length - 1) ? <div >
                {store.code.start ? (
                    <>
                        <span style={{ fontSize: Math.min(900 / store.code.expression.length, 16), color: store.settings.configColors['Code Highlight'] }}>
                            {store.code.expression}
                        </span>
                        {' '}={' '}
                        <ValText value={store.code.value} type={getType(store.code.value)} />
                    </>
                ) : (store.iterator.step.access && <span>{store.iterator.step.access}</span>)}
            </div> :
                <div className="has-text-danger">
                    {last.error}
                </div>
            }

        </div>
    )
})
export default StepView