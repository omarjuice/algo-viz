import React from 'react';
import Tooltip from 'rc-tooltip';
import store from '../../store';
import { observer } from 'mobx-react';


type language = 'JavaScript' | 'Python'

const languages: [language, string][] = [["JavaScript", process.env.PUBLIC_URL + '/nodejs.svg'], ['Python', process.env.PUBLIC_URL + '/python.svg']]

const Language: React.FC = observer(() => {
    return (
        <div>
            <div className="columns is-multiline">
                <div className="column is-half">
                    <div className="box has-background-dark has-text-light"
                        style={{ border: '5px outset ' + store.settings.configColors['Step Slider Rail'] }}>
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
                        <div className="box has-background-dark has-text-grey"
                            style={{ border: '5px solid #363636' }}>
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
