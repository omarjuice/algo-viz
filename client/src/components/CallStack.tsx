import React from 'react'
import store from '../store'
import { observer } from 'mobx-react';
import { Transition } from 'react-spring/renderprops';
const CallStack: React.FC = observer(() => {
    if (!store.allowRender) return null
    const stack = []
    const len = store.state.callStack.length
    if (len > 100) {
        return <div className="call-stack box has-background-danger">
            {len} stack frames
        </div>
    } else {
        for (let i = len - 1; i >= 0; --i) {
            stack.push(
                [i, store.state.callStack[i]]
            )
        }
    }



    // return null
    const height = Math.min(store.windowHeight / stack.length, 40)
    return (
        <div className="call-stack">
            <ul >
                <Transition items={stack}
                    from={{ transform: `translateY(-40px)`, opacity: 0 }}
                    enter={{ transform: `translateY(0px)`, opacity: 1 }}
                    leave={len <= 100 ? { transform: `translateY(-40px)`, height, opacity: 0 } : {}}
                >
                    {([i, name]) => props => {
                        return (
                            <li style={{
                                ...props,
                                position: 'relative',
                                zIndex: i as number,
                                height: `${height}px`,
                                width: store.windowWidth / 7,
                                fontSize: `${Math.min(height / 2, 100 / (name ? (name as string).length : 1))}px`,
                                marginBottom: `-${height / 4}px`,
                                background: 'orange',
                                borderBottomLeftRadius: '50%',
                                borderBottomRightRadius: '50%',
                                borderColor: 'black',
                                borderWidth: '1px',
                                borderStyle: 'solid',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}
                                key={i} className="list-item has-text-centered">
                                <span style={{ marginTop: `${height / 4}px` }} >
                                    {
                                        `${name || ''}`
                                    }
                                </span>
                            </li>
                        )
                    }
                    }
                </Transition>
            </ul>
        </div>
    )
})
export default CallStack