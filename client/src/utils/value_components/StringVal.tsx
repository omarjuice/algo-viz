import React from 'react';

type Props = {
    value: string
}

export const StringVal: React.FC<Props> = ({ value }) => {
    return (
        <span className="has-text-warning">"<span>{value}</span>"</span>
    )
}

