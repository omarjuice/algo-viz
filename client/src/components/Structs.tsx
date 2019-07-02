import React, { ReactNode } from 'react';
import { observer } from 'mobx-react';
import store from '../store';
import ArrayStruct from './compose_components/ArrayStruct';
import HashStruct from './compose_components/HashStruct';



const Structs: React.FC = observer(() => {

    const ids = store.structs.bindings
    const arrays: ReactNode[] = []
    const objects: ReactNode[] = []
    ids.forEach((id) => {
        if (store.viz.types[id] === 'Array') {
            const element = (
                <ArrayStruct key={id} pointed={false} ratio={1} structure={store.structs.objects[id]} objectId={id} />
            )
            arrays.push(element)

        } else if (store.viz.types[id] === 'Object') {
            const element = (
                <HashStruct key={id} pointed={false} ratio={1} structure={store.structs.objects[id]} objectId={id} />
            )
            objects.push(element)
        }
    })

    return (
        <div className="structs columns is-multiline">
            <div className="column is-half">
                {arrays}
            </div>
            <div className="column is-half">
                {objects}
            </div>
        </div>
    );
})

export default Structs;
