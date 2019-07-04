import React from 'react';
import store from '../../../store';

type Props = {
    value: number
}

export const NumberVal: React.FC<Props> = ({ value }) => {
    return (
        <span style={{ color: store.settings.valueColors.number }}><span>{value}</span></span>
    )
}

