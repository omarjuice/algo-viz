import React from 'react';
import { BooleanVal, StringVal, NumberVal, SpecialVal } from './value_components'
import store from '../store';

export const getVal = (value: any) => {
    if (typeof value === 'boolean') {
        return <BooleanVal value={value} />
    } else if (typeof value === 'string') {
        const type = store.viz.types[value]
        let count = 0;
        while (value[count] === '_') count++
        if (count === 1 && type) {
            return <SpecialVal value={type as 'undefined' | 'null' | '<empty>' | 'NaN' | 'Infinity'} />
        }
        if (count === 2 && type) {
            return '[Function]'
        }
        if (count === 3 && type) {
            return store.viz.types[value]
        }
        return <StringVal value={value} />
    } else if (typeof value === 'number') {
        return <NumberVal value={value} />
    }
    return value
}

