import React from 'react';

const DefaultInput = ({ value, onChange, placeholder, width }) => {
    return (
        <input
            type="text"
            className="input"
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            style={{
                width: '300px',
                height: '40px',
                fontSize: '16px',
                padding: '8px',
                marginBottom: '20px',
            }}
        />
    );
}

export {DefaultInput};