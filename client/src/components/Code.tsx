import React from 'react'
import store from '../store'
import { observer } from 'mobx-react';

const quotes = new Set()
quotes.add('"').add("'").add("`")

const Code: React.FC = observer(() => {

    return (<div style={{ color: store.settings.configColors['Code'] }} className="user-code is-size-7">{
        store.code.tokenMap.map((token, i) => {

            if (token.char === '\n') {
                return <br key={i} />
            } else {
                return <span key={i}>
                    <span style={{ color: token.highlight && store.settings.configColors['Code Highlight'], whiteSpace: 'pre' }} className={`${store.allowRender && token.highlight ? 'highlight' : ''} token-${token.index}`}>
                        {token.char}
                    </span>
                </span>
            }
        })
    }
    </div>)
})
export default Code