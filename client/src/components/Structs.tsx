import React, { ReactNode } from 'react';
import { observer } from 'mobx-react';
import store from '../store';
import ArrayStruct from './compose_components/ArrayStruct';
import HashStruct from './compose_components/HashStruct';
import DataStruct from './compose_components/DataStruct';



const Structs: React.FC = observer(() => {
    if (!store.allowRender) return null
    const ids = store.structs.bindings
    const arrays: ReactNode[] = []
    const objects: ReactNode[] = []
    const data: ReactNode[] = []
    ids.forEach((id) => {
        if (store.viz.types[id] === 'Array') {
            arrays.push(
                <ArrayStruct key={id} pointed={false} ratio={1} structure={store.structs.objects[id]} objectId={id} />
            )

        } else if (['Object', 'Map', 'Set'].includes(store.viz.types[id])) {
            objects.push(
                <HashStruct orientation={'column'} key={id} pointed={false} ratio={1} structure={store.structs.objects[id]} objectId={id} />
            )
        } else {
            data.push(
                <DataStruct key={id} ratio={1} structure={store.structs.objects[id]} objectId={id} />
            )
        }
    })

    return (
        <div className="structs columns is-multiline">
            {data.length ? <div className="column is-full">
                {data}
            </div> : null}
            {arrays.length ? <div className={`column is-${objects.length ? 'half' : 'full'}`}>
                {arrays}
            </div> : null}
            {objects.length ? <div className={`column is-${arrays.length ? 'half' : 'full'}`}>
                {objects}
            </div> : null}
        </div>
    );
})

export default Structs;
