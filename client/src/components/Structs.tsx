import React, { ReactNode } from 'react';
import { observer } from 'mobx-react';
import store from '../store';
import ArrayStruct from '../utils/value_components/ArrayStruct';



const Structs: React.FC = observer(() => {

    const ids = store.structs.bindings
    const structures: ReactNode[] = []
    const count = [0]
    ids.forEach((id) => {
        if (store.viz.types[id] === 'Array') {
            count[0]++
            const element = (
                <div key={id} className={`column is-full`}>
                    <ArrayStruct ratio={1} structure={store.structs.objects[id]} objectId={id} />
                </div>
            )
            structures.push(element)

        }
    })


    return (
        <div className="structs columns is-multiline">
            {structures}
        </div>
    );
})

export default Structs;
