import React from 'react'
import store from '../store'
import { observer } from 'mobx-react';
import ValText from './compose_components/ValText';
import getType from '../utils/getType';

const Identifiers: React.FC = observer(() => {
    const identifiers = store.state.activeIds
    if (!store.allowRender) return null

    const colSize = Math.floor(12 / identifiers.length)
    let fontSize = Math.floor(Math.min(5 + identifiers.length / 2, 7))
    return (
        <div className="values-container">
            <div className="columns has-text-white identifiers">
                {identifiers.map((ids, i) => {
                    return <div key={i} className={`column is-${colSize} is-size-${fontSize}`}>{
                        ids.map((id, i) => (
                            <p key={i}>
                                <span>{id.name}</span>
                                <span>{' '}={' '}</span>
                                <ValText value={id.value} type={getType(id.value)} />
                            </p>
                        ))
                    }</div>
                })}
            </div>
        </div>
    )
})
export default Identifiers