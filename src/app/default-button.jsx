import React from 'react';

const DefaultButton = ({ onClick, children, isFirst = false, isLast = false, style = {} }) => {
    const baseStyle = {
        backgroundColor: '#D72B00',
        color: '#ffffff',
        border: 'none',
        padding: '8px 16px',
        fontSize: '16px',
        cursor: 'pointer',
        fontWeight: '500',
        transition: 'background-color 0.2s',
    };

    const borderRadiusStyle = {
        borderTopLeftRadius: isFirst ? '8px' : '0',
        borderBottomLeftRadius: isFirst ? '8px' : '0',
        borderTopRightRadius: isLast ? '8px' : '0',
        borderBottomRightRadius: isLast ? '8px' : '0',
    };

    return (
        <button
            onClick={onClick}
            style={{
                ...baseStyle,
                ...borderRadiusStyle,
                ...style,
            }}
            onMouseEnter={(e) => {
                e.target.style.backgroundColor = '#b02400';
            }}
            onMouseLeave={(e) => {
                e.target.style.backgroundColor = '#D72B00';
            }}
        >
            {children}
        </button>
    );
};

export { DefaultButton };

