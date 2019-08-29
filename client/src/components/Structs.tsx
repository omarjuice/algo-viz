import React, { ReactNode } from 'react';
import { observer } from 'mobx-react';
import store from '../store';
import ArrayStruct from './compose_components/ArrayStruct';
import HashStruct from './compose_components/HashStruct';
import DataStruct from './compose_components/DataStruct';
import DataStructContainer from './compose_components/DataStructContainer';



const Structs: React.FC = observer(() => {
    if (!store.allowRender || !store.settings.config['Objects']) return null;
    const arrays: ReactNode[] = []
    const objects: ReactNode[] = []
    const data: ({ id: string, idx: number })[] = []
    const ids = store.structs.bindings
    let i = 0;
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
                {
                    id,
                    idx: i
                }
            )
        }
        i++
    })


    let heightMultiple = 2;
    let dataCol = 12;
    let arrayCol = 7;
    let objCol = 5;
    if (store.structsWidth >= 10) {
        if (data.length) {
            dataCol = 6;
            if (arrays.length && !objects.length) {
                arrayCol = 6
                objCol = 0;
            } else if (objects.length && !arrays.length) {
                arrayCol = 0;
                objCol = 6;
            } else if (objects.length && arrays.length) {
                arrayCol = 4;
                objCol = 2;
            } else {
                dataCol = 12
                arrayCol = 0;
                objCol = 0;
            }
        } else {
            arrayCol = objects.length ? 9 : 12;
            objCol = arrays.length ? 3 : 12;
        }
        heightMultiple = data.length > 1 ? 1 : 2
    } else {
        if (arrays.length && !objects.length) {
            arrayCol = 12;
        } else if (objects.length && !arrays.length) {
            objCol = 12;
        }
        if (arrays.length || objects.length) {
            heightMultiple = 1
        }
    }

    store.setWidths(
        {
            array: Math.max(arrayCol / 6, .5),
            object: 1,
            data: (dataCol / 6)
        },
        [
            arrays.length,
            objects.length,
            data.length
        ]
    )



    return (
        <div className="structs columns is-multiline">
            {data.length ? <div className={`column is-narrow is-${dataCol}`}>
                {data.map((d) => <DataStructContainer key={d.id} {...d} heightMultiple={heightMultiple} />)}
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
