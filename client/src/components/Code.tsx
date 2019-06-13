import React from 'react'
import store from '../store'
import { observer } from 'mobx-react';

const Code: React.FC = observer(() => {
    let counter: number = 0
    let flag = false
    const tab = (key: number) => <span key={key} className="tab"></span>
    return (<div className="user-code">{
        store.code.tokenMap.map((token, i) => {
            if (token.char === '{') {
                counter++
            } else if (token.char === '}') {
                --counter
            }
            if (token.char === '\n') {
                flag = true
                return <br key={i} />
            } else {
                let tabs = []
                if (flag && token.char !== ' ') {
                    for (let i = 0; i < counter; i++) {
                        tabs.push(tab(i))
                    }
                    flag = false
                }
                return <span key={i}>
                    {tabs}
                    <span className={token.highlight ? 'highlight' : ''}>
                        {token.char}
                    </span>
                </span>
            }
        })
    }</div>)
})
export default Code