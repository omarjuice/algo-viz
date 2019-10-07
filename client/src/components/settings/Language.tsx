import React from 'react';
import Tooltip from 'rc-tooltip';
import store from '../../store';
import { observer } from 'mobx-react';




const Language: React.FC = observer(() => {
    return (
        <div>
            <div className="columns is-multiline">
                <div className="column is-half">
                    <div className="box"
                        style={{
                            border: '5px outset ' + store.settings.configColors['Step Slider Track'],
                            color: store.settings.configColors["Code Highlight"],
                            backgroundColor: store.settings.configColors["Secondary Background"]

                        }}>
                        <div className="columns ">
                            <div className="column is-half has-text-centered has-text-weight-bold">
                                JavaScript
                            </div>
                            <div className="column is-half has-text-centered"
                                style={{ display: 'flex', justifyContent: 'center' }}>
                                <figure className="image is-32x32">
                                    <img src={process.env.PUBLIC_URL + '/nodejs.svg'} alt="javascript" />
                                </figure>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="column is-half">
                    <Tooltip overlay={'Coming when I have a job...'} placement={'bottom'}>
                        <div className="box"
                            style={{
                                border: '5px solid ' + store.settings.configColors["Secondary Background"],
                                color: store.settings.configColors["Code"],
                                backgroundColor: store.settings.configColors["Secondary Background"]
                            }}>
                            <div className="columns ">
                                <div className="column is-half has-text-centered has-text-weight-bold">
                                    Python
                            </div>
                                <div className="column is-half has-text-centered" style={{ display: 'flex', justifyContent: 'center' }}>
                                    <figure className="image is-32x32">
                                        <img src={process.env.PUBLIC_URL + '/python.svg'} alt="python" />
                                    </figure>
                                </div>
                            </div>
                        </div>
                    </Tooltip>
                </div>
            </div>
        </div>
    );
})

export default Language;
