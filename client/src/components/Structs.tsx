import React from 'react';
import { observer } from 'mobx-react';
import store from '../store';
import ArrayStruct from '../utils/value_components/ArrayStruct';



const Structs: React.FC = observer(() => {

    const ids = store.structs.active
    const structures = []
    for (const id of ids) {
        if (store.viz.types[id] === 'Array') {
            structures.push(
                <ArrayStruct key={id} structure={store.structs.objects[id]} objectId={id} />
            )
        }
    }

    return (
        <div>
            {structures}
        </div>
    );
})

export default Structs;
