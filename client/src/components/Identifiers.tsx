import React from 'react'
import store from '../store'
import { observer } from 'mobx-react';
import { getVal } from '../utils';

const Identifiers: React.FC = observer(() => {
    const identifiers = store.state.activeIds
    if (!store.allowRender) return null
    return (
        <div className="box has-background-info">
            {identifiers.map((id, i) => {
                return <p key={i}>
                    <span>{id.name}</span>
                    <span>{' '}={' '}</span>
                    <span>{getVal(id.value)}</span>
                </p>
            })}
        </div>
    )
})
export default Identifiers