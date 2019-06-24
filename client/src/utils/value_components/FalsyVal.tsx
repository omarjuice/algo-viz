import React from 'react';

type Props = {
    value: 'null' | 'undefined' | '<empty>' | 'NaN'
}

export const FalsyVal: React.FC<Props> = ({ value }) => {
    return (
        <span className="has-text-info"><span>{value}</span></span>
    )
}

