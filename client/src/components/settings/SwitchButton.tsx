import React from 'react';
import store from '../../store';
import { observer } from 'mobx-react';


type Props = {
    size: number
    toggled: boolean
    onClick: () => void
}

const SwitchButton: React.FC<Props> = observer(({ size, toggled, onClick }) => {
    const styles: React.CSSProperties = {
        width: size,
        height: size / 2,
        borderRadius: '10%',
        backgroundColor: toggled ? store.settings.configColors['Code Highlight'] : store.settings.configColors["Secondary Background"],
        transition: 'background-color 200ms'
    }
    return (
        <a onClick={onClick} href="#/">
            <div style={styles}>
                <div style={{
                    marginLeft: toggled ? styles.height : 0,
                    height: styles.height,
                    width: styles.height,
                    backgroundColor: store.settings.configColors['Text'],
                    borderRadius: '10%',
                    border: '2px outset gray',
                    transition: `margin-left 200ms`
                }} />
            </div>
        </a>
    );
}
)
export default SwitchButton;
