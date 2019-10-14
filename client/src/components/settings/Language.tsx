import React from 'react';
import Tooltip from 'rc-tooltip';
import store from '../../store';
import { observer } from 'mobx-react';




const Language: React.FC = observer(() => {
    const inactive = {
        border: '5px solid ' + store.settings.configColors["Secondary Background"],
        color: store.settings.configColors["Code"],
        backgroundColor: store.settings.configColors["Secondary Background"]
    }
    const active = {
        border: '5px outset ' + store.settings.configColors['Step Slider Track'],
        color: store.settings.configColors["Code Highlight"],
        backgroundColor: store.settings.configColors["Secondary Background"]

    }
    return (
        <div>
            <div className="columns is-multiline">
                <div className="column is-half">
                    <a href="#/" onClick={() => store.setLanguage('javascript')}>
                        <div className="box"
                            style={store.language === 'javascript' ? active : inactive}>
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
                    </a>
                </div>
                <div className="column is-half">
                    {/* <Tooltip overlay={'Coming when I have a job...'} placement={'bottom'}> */}
                    <a href="#/" onClick={() => store.setLanguage('python')}>

                        <div className="box"
                            style={store.language === 'python' ? active : inactive}>
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
                        {/* </Tooltip> */}
                    </a>
                </div>
            </div>
        </div>
    );
})

export default Language;
