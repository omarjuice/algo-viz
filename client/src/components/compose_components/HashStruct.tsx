import React from 'react';
import { observer } from 'mobx-react';
import store from '../../store';
import HashVal from './HashVal';

type Props = {
    structure: Viz.Structure,
    objectId: string,
    ratio: number,
    pointed: boolean
}

const HashStruct: React.FC<Props> = observer(({ structure, objectId, ratio, pointed }) => {
    const obj: React.ReactElement[] = [];
    const maxWidth = store.windowWidth * .3

    for (const key in structure) {
        obj.push(
            <div key={key}>
                <HashVal prop={key} objectId={objectId} ratio={ratio} size={30} object={structure} />
            </div>
        )
    }

    const size = Math.max(Math.round(ratio * 5), 3)
    const styles: React.CSSProperties = {
        maxHeight: '100%',
        overflowY: 'scroll'
    }
    return (
        <div className={`object-struct ${(pointed || store.structs.activePointers[objectId]) && 'pointed'}`}>
            <div className="is-size-1" style={{ transform: 'rotate(90deg)', color: 'white' }}>{'{'}</div>
            {obj}
            <div className="is-size-1" style={{ transform: 'rotate(90deg)', color: 'white' }}>{'}'}</div>
        </div>
    );
})

export default HashStruct;
