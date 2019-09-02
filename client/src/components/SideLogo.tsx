import React, { Component } from 'react';
import ValDisplay from './compose_components/ValDisplay';
import store from '../store';
import { observer } from 'mobx-react';



const SideLogo: React.FC = observer(() => {

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            height: store.windowHeight * .9
        }} className="has-text-centered">
            <div className="has-text-centered">
                {'ALGO'.split('').map((c, i) => {
                    return <ValDisplay key={i} color={store.settings.configColors['Step Slider Track']} size={50} anim={[false, false]} textDisplay={c} highlight={false} objectId={c} />
                })}
            </div>
            <div className="has-text-centered">
                <ValDisplay color={store.settings.configColors['Step Slider Track']} size={50} anim={[false, false]} textDisplay={'-'} highlight={false} objectId={'-'} />
            </div>
            <div className="has-text-centered">
                {'VIZ'.split('').map((c, i) => {
                    return <ValDisplay key={i} color={store.settings.configColors['Step Slider Track']} size={50} anim={[false, false]} textDisplay={c} highlight={false} objectId={c} />
                })}
            </div>
        </div>
    )
})


export default SideLogo