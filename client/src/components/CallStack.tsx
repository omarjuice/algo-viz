import React from 'react'
import store from '../store'
import { observer } from 'mobx-react';

const CallStack: React.FC = observer(() => {
    return (
        <div className="box has-background-info">
            <ul className="list">
                {
                    store.state.callStack.reduceRight((list, funcName) => {
                        list.push(
                            <li className="list-item">{funcName}</li>
                        )
                        return list
                    }, [] as Array<JSX.Element>)
                }
            </ul>
        </div>
    )
})
export default CallStack