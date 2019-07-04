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
        // maxHeight: '100%',
        // overflowY: 'scroll'
    }
    const color = store.settings.objectColors['Object']
    if (pointed || store.structs.activePointers[objectId]) {
        styles.boxShadow = `0 0 5px 2.5px ${color}`
    }
    return (
        <div style={styles} className={`object-struct`}>
            <div className="is-size-1" style={{ transform: 'rotate(90deg)', color }}>{'{'}</div>
            {obj}
            <div className="is-size-1" style={{ transform: 'rotate(90deg)', color }}>{'}'}</div>
        </div>
    );
})

export default HashStruct;
