import React from 'react';


type Props = {
    size: number
    toggled: boolean
    onClick: () => void
}

const SwitchButton: React.FC<Props> = ({ size, toggled, onClick }) => {
    const styles: React.CSSProperties = {
        width: size,
        height: size / 2,
        borderRadius: '10%',
        backgroundColor: toggled ? 'green' : 'gray'
    }
    return (
        <a onClick={onClick} href="#/">
            <div style={styles}>
                <div style={{
                    marginLeft: toggled ? styles.height : 0,
                    height: styles.height,
                    width: styles.height,
                    backgroundColor: 'white',
                    borderRadius: '10%',
                    border: '2px outset gray',
                    transition: `margin-left 200ms`
                }} />
            </div>
        </a>
    );
}

export default SwitchButton;
