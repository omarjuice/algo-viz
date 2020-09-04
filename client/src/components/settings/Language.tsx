import React from 'react';
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
                            <div className="columns is-centered ">
                                <div className="column is-half has-text-centered is-paddingless has-text-weight-bold">
                                    JavaScript
                                    <p className="is-size-7 has-text-centered" style={{ color: store.language === 'javascript' ? active.color : inactive.color }}>12.13.0</p>
                                </div>
                                <div className="column is-half has-text-centered is-paddingless"
                                    style={{ display: 'flex', justifyContent: 'center' }}>
                                    <figure className="image is-32x32">
                                        <img src={process.env.PUBLIC_URL + '/javascript.svg'} alt="javascript" />
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
                            <div className="columns is-centered ">
                                <div className="column is-half has-text-centered is-paddingless has-text-weight-bold">
                                    Python
                                    <p className="is-size-7 has-text-centered" style={{ color: store.language === 'python' ? active.color : inactive.color }}>3.7.0</p>
                                </div>
                                <div className="column is-half has-text-centered is-paddingless" style={{ display: 'flex', justifyContent: 'center' }}>
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
