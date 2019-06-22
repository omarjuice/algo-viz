import React from 'react'
import store from '../store'
import { observer } from 'mobx-react';

const quotes = new Set()
quotes.add('"').add("'").add("`")

const Code: React.FC = observer(() => {
    let counter: number = 0
    let quoteStack: string[] = [];
    let flag = false
    const tab = (key: number) => <span key={key} className="tab"></span>
    // if (!store.allowRender) return (
    //     <div className="user-code is-size-7">{
    //         store.viz.code.split('').map((token, i) => {
    //             if (!quoteStack.length) {
    //                 if (token === '{') {
    //                     counter++
    //                 } else if (token === '}') {
    //                     counter--
    //                 }
    //             }
    //             if (quotes.has(token)) {
    //                 if (token === quoteStack[quoteStack.length - 1]) {
    //                     quoteStack.pop()
    //                 } else {
    //                     quoteStack.push(token)
    //                 }
    //             }
    //             if (token === '\n') {
    //                 flag = true
    //                 return <br key={i} />
    //             } else {
    //                 const tabs = []
    //                 if (flag && token !== ' ') {
    //                     for (let i = 0; i < counter; i++) {
    //                         tabs.push(tab(i))
    //                     }
    //                     flag = false
    //                 }
    //                 return <span key={i}>
    //                     {tabs}
    //                     <span>
    //                         {token}
    //                     </span>
    //                 </span>
    //             }
    //         })
    //     }
    //     </div>
    // )


    return (<div className="user-code is-size-7">{
        store.code.tokenMap.map((token, i) => {
            if (!quoteStack.length) {
                if (token.char === '{') {
                    counter++
                } else if (token.char === '}') {
                    counter--
                }
            }
            if (quotes.has(token.char)) {
                if (token.char === quoteStack[quoteStack.length - 1]) {
                    quoteStack.pop()
                } else {
                    quoteStack.push(token.char)
                }
            }
            if (token.char === '\n') {
                flag = true
                return <br key={i} />
            } else {
                const tabs = []
                if (flag && token.char !== ' ') {
                    for (let i = 0; i < counter; i++) {
                        tabs.push(tab(i))
                    }
                    flag = false
                }
                return <span key={i}>
                    {tabs}
                    <span className={store.allowRender && token.highlight ? 'highlight' : ''}>
                        {token.char}
                    </span>
                </span>
            }
        })
    }
    </div>)
})
export default Code