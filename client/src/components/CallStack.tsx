import React from 'react'
import store from '../store'
import { observer } from 'mobx-react';

const CallStack: React.FC = observer(() => {
    if (!store.allowRender) return null
    const stack = []
    const limit = Math.max(store.state.callStack.length - 10, 0)
    for (let i = store.state.callStack.length - 1; i >= limit; --i) {
        stack.push(
            <li key={i} className="list-item has-text-centered">{store.state.callStack[i]} {i}</li>
        )

    }

    if (store.state.callStack.length - 11 > 0)
        stack.push(<li key={'Yo'} className="list-item has-text-centered">{store.state.callStack.length - 11} more</li>)

    return (
        <div className="call-stack">
            <ul className="list">
                {stack}
            </ul>
        </div>
    )
})
export default CallStack