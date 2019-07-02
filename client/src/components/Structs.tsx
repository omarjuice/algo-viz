import React, { ReactNode } from 'react';
import { observer } from 'mobx-react';
import store from '../store';
import ArrayStruct from './compose_components/ArrayStruct';



const Structs: React.FC = observer(() => {

    const ids = store.structs.bindings
    const arrays: ReactNode[] = []
    const objects: ReactNode[] = []
    const count = [0]
    ids.forEach((id) => {
        if (store.viz.types[id] === 'Array') {
            count[0]++
            const element = (
                // <div key={id} className={`column is-h`}>
                <ArrayStruct key={id} pointed={false} ratio={1} structure={store.structs.objects[id]} objectId={id} />
                // </div>
            )
            arrays.push(element)

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
