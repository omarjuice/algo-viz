import React from 'react';
import store from '../../../store';

type Props = {
    value: string
}

export const StringVal: React.FC<Props> = ({ value }) => {
    return (
        <span style={{ color: store.globals.colors.string }}>"<span>{value}</span>"</span>
    )
}

