import React from 'react';
import { getPatternProperties, valueToString } from './utils.js';
import { containerStyles, textStyles } from './styles.js';
import './mainWindow.css';

/**
 * Компонент левого sidebar
 * Отображает список всех паттернов с их свойствами
 */
const LeftSidebar = ({ patterns, selectedPatternId, selectedComponentId, onSelectPattern }) => {

    return (
        <div 
            className="custom-scrollbar"
            style={{
                width: '250px',
                minWidth: '250px',
                flexShrink: 0,
                backgroundColor: 'transparent',
                padding: '0',
                overflowY: 'auto',
                height: 'calc(100vh - 120px)',
                display: 'flex',
                flexDirection: 'column',
            }}
        >
                    {Object.entries(patterns).map(([patternId, pattern], index) => {
                        const isPatternSelected = selectedPatternId === patternId;
                        const properties = getPatternProperties(pattern, ['inner']);
                
                return (
                    <div 
                        key={patternId} 
                            style={containerStyles.patternCard}
                    >
                        <div 
                            style={{
                                ...textStyles.patternName,
                                backgroundColor: isPatternSelected
                                    ? '#D72B00'
                                    : 'transparent',
                                color: isPatternSelected
                                    ? '#ffffff'
                                    : textStyles.patternName.color,
                            }}
                            onClick={() => {
                                onSelectPattern && onSelectPattern(patternId, null);
                            }}
                            onMouseEnter={(e) => {
                                if (!isPatternSelected) {
                                    e.target.style.backgroundColor = '#f5f5f5';
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (!isPatternSelected) {
                                    e.target.style.backgroundColor = 'transparent';
                                }
                            }}
                        >
                            {patternId}
                        </div>
                        <div>
                            {properties.map(([key, value]) => (
                                <div
                                    key={key}
                                    style={{
                                        padding: '6px 8px',
                                        marginBottom: '4px',
                                        fontSize: '13px',
                                        color: '#666',
                                        backgroundColor: '#f9f9f9',
                                        borderRadius: '4px',
                                    }}
                                >
                                        <div style={textStyles.propertyLabel}>
                                            {key}:
                                        </div>
                                        <div style={textStyles.propertyValue}>
                                            {valueToString(value)}
                                        </div>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            })}
            {Object.keys(patterns).length === 0 && (
                <div style={{
                    padding: '20px',
                    textAlign: 'center',
                    color: '#999',
                }}>
                    Нет паттернов
                </div>
            )}
        </div>
    );
};

export { LeftSidebar };

