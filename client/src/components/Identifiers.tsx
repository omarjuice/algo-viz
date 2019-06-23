import React from 'react'
import store from '../store'
import { observer } from 'mobx-react';
import { getVal } from '../utils';

const Identifiers: React.FC = observer(() => {
    const identifiers = store.state.activeIds
    if (!store.allowRender) return null
    return (
        <div className="columns">
            <div className="column">
                <div className="container has-text-white">
                    {identifiers.map((id, i) => {
                        return <p key={i}>
                            <span>{id.name}</span>
                            <span>{' '}={' '}</span>
                            <span>{getVal(id.value)}</span>
                        </p>
                    })}
                </div>
            </div>
            <div className="column">
                {store.code.start ? (
                    <>
                        <div className="has-text-success is-size-7">
                            {store.code.expression}
                        </div>
                        <div className="has-text-primary is-size-5">
                            {getVal(store.iterator.step.value)}
                        </div>
                    </>
                ) : null}
            </div>
        </div>
    )
})
export default Identifiers