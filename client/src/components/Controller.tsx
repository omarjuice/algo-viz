import React from 'react';
import { observer } from 'mobx-react';
import store from '../store/index';

const Controller: React.FC = observer(() => {
    const { iterator } = store
    const iterating = iterator.iterating
    return (
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
    )
})

export default Controller