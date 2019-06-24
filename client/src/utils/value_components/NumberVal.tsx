import React from 'react';

type Props = {
    value: number
}

export const NumberVal: React.FC<Props> = ({ value }) => {
    return (
        <span className="has-text-primary"><span>{value}</span></span>
    )
}

