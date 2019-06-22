import React from 'react';
import { observer } from 'mobx-react';
import store from '../store/index';
import Slider from 'rc-slider';
import 'rc-slider/assets/index.css'
const Controller: React.FC = observer(() => {
    const { iterator } = store
    const iterating = iterator.iterating
    return (
        <div className="container">
            <div className="buttons">
                <button
                    className={"button"}
                    onClick={() => iterating ? iterator.pause() : iterator.play()}
                >
                    {iterating ? 'Pause' : 'Play'}
                </button>
                <button
                    className="button"
                    onClick={() => iterator.direction = !iterator.direction}
                >
                    {iterator.direction ? 'Back' : 'Forward'}
                </button>
                <button
                    className="button"
                    onClick={() => iterator.faster()}
                >
                    Faster
            </button>
                <button
                    className="button"
                    onClick={() => iterator.slower()}
                >
                    Slower
            </button>

            </div>
            <Slider
                min={-1}
                max={store.viz.steps.length}
                defaultValue={-1}
                value={store.iterator.handling ? store.iterator.handler.value : store.iterator.index}
                onBeforeChange={() => { store.iterator.beforeChange() }}
                onChange={(e) => store.iterator.change(e)}
                onAfterChange={() => { store.iterator.afterChange() }}
                trackStyle={{ backgroundColor: '#A663CC', height: 10 }}
                handleStyle={{
                    borderColor: 'blue',
                    height: 14,
                    width: 14,
                    marginLeft: -5,
                    marginTop: -2,
                    backgroundColor: 'black',
                }}
                railStyle={{ backgroundColor: '#C2BBF0', height: 10 }}
            />
            <br />
        </div>
    )
})

export default Controller