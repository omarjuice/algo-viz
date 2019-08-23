import React, { ReactNode } from 'react';
import { observer } from 'mobx-react';
import store from '../store';
import ArrayStruct from './compose_components/ArrayStruct';
import HashStruct from './compose_components/HashStruct';
import DataStruct from './compose_components/DataStruct';



const Structs: React.FC = observer(() => {
    if (!store.allowRender || !store.settings.config['Objects']) return null;
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
                <HashStruct key={id} pointed={false} ratio={1} structure={store.structs.objects[id]} objectId={id} />
            )
        } else {
            data.push(
                <div key={id} style={{ overflowX: 'scroll', padding: 2 }}>
                    <DataStruct idx={data.length} key={id} ratio={1} structure={store.structs.objects[id]} objectId={id} isList={true} />
                </div>
            )
        }
    })
    store.setWidths({
        array: objects.length ? .5 : 1,
        object: arrays.length ? .5 : 1,
        data: 1
    })


    let dataCol = 12;
    let arrayCol = 6;
    let objCol = 6;
    if (arrays.length && !objects.length) {
        arrayCol = 12;
    }
    if (objects.length && !arrays.length) {
        objCol = 12;
    }

    if (store.structsWidth >= 10) {
        dataCol = 7;
        arrayCol = 3;
        objCol = 2;

    }




    return (
        <div className="structs columns is-multiline">
            {data.length ? <div className={`column is-narrow is-${dataCol}`}>
                {data}
            </div> : null}
            {arrays.length ? <div className={`column is-narrow is-${arrayCol}`}>
                {arrays}
            </div> : null}
            {objects.length ? <div className={`column is-narrow is-${objCol}`}>
                {objects}
            </div> : null}
        </div>
    );
})

export default Structs;
