import React, { ReactNode } from 'react';
import { observer } from 'mobx-react';
import store from '../store';
import ArrayStruct from './compose_components/ArrayStruct';
import HashStruct from './compose_components/HashStruct';
import DataStruct from './compose_components/DataStruct';



const Structs: React.FC = observer(() => {
    if (!store.allowRender) return null
    const arrays: ReactNode[] = []
    const objects: ReactNode[] = []
    const data: ReactNode[] = []
    const ids = store.structs.bindings

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
                <DataStruct idx={data.length} key={id} ratio={1} structure={store.structs.objects[id]} objectId={id} isList={true} />
            )
        }
    })
    const ratio = 1 / (Math.min(objects.length, 1) + Math.min(arrays.length, 1) + Math.min(data.length, 1))
    store.setWidths({
        array: arrays.length ? ratio : 1,
        object: objects.length ? ratio : 1,
        data: data.length ? ratio : 1
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
