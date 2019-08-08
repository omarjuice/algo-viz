import React from 'react'
import store from '../store'
import { observer } from 'mobx-react';
import { Transition } from 'react-spring/renderprops';
import Tooltip from 'rc-tooltip';


type stackItem = [number, string | void]

const renderItem = (item: stackItem, height: number, props: React.CSSProperties) => {

    const [i, name] = item
    return (
        <Tooltip
            overlay={() => (
                <div className="has-text-weight-bold">
                    <span style={{ fontSize: 9 }}>{i}: {name}</span>
                </div >)}
            placement={'left'}
            trigger={['hover']} defaultVisible={false} >
            <li style={{
                ...props,
                position: 'relative',
                zIndex: i as number,
                height: `${height}px`,
                width: store.windowWidth / 7,
                fontSize: `${Math.min(height / 2, 100 / (name ? (name as string).length : 1))}px`,
                marginBottom: i === 0 ? '0px' : `-${height / 4}px`,
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
                        `${name ? (name as string)[0] === '_' ? 'anonymous' : name : ''}`
                    }
                </span>

            </li>
        </Tooltip>

    )
}
const CallStack: React.FC = observer(() => {
    if (!store.allowRender) return null
    const stack: stackItem[] = []
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
    if (store.iterator.speed < 8) {
        return (
            <div className="call-stack">
                <ul >
                    <Transition
                        config={{ duration: (store.iterator.baseTime / store.iterator.speed) * 3 }}
                        items={stack}
                        from={{ transform: `translateY(-40px)`, opacity: 0 }}
                        enter={{ transform: `translateY(0px)`, opacity: 1 }}
                        leave={len <= 100 ? { transform: `translateY(-40px)`, height, opacity: 0, borderTopLeftRadius: '50%', borderTopRightRadius: '50%' } : {}}
                    >
                        {([i, name]) => (props: React.CSSProperties) => {
                            if (i === stack.length - 1) {
                                props.borderTopLeftRadius = props.borderTopRightRadius = '50%'
                            }
                            return (
                                renderItem([i as number, name as any], height, props)
                            )
                        }}
                    </Transition>
                </ul>
            </div>
        )
    } else {
        return <div className="call-stack">
            <ul>
                {stack.map(([i, name]) => {
                    const props: React.CSSProperties = {}
                    if (i === stack.length - 1) {
                        props.borderTopLeftRadius = props.borderTopRightRadius = '50%'
                    }
                    return renderItem([i, name], height, props)
                })}
            </ul>
        </div>
    }
})
export default CallStack