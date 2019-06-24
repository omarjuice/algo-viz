import React from 'react';

type Props = {
    value: boolean
}

export const BooleanVal: React.FC<Props> = ({ value }) => {
    return (
        <span className="has-text-link"><span>{String(value)}</span></span>
    )
}

