import React from 'react';
import { getPatternProperties, valueToString } from './utils.js';
import { containerStyles, textStyles } from './styles.js';
import { COLORS, SIZES } from './constants.js';
import './mainWindow.css';

/**
 * Компонент левого sidebar
 * Отображает список всех паттернов с их свойствами
 */
const LeftSidebar = ({ patterns, selectedPatternId, selectedComponentId, onSelectPattern, onCreateEmptyPattern }) => {

    return (
        <div 
            style={{
                width: '250px',
                minWidth: '250px',
                flexShrink: 0,
                backgroundColor: 'transparent',
                padding: '0',
                height: 'calc(100vh - 120px)',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
            }}
        >
            {/* Кнопка добавления паттерна */}
            <div style={{
                position: 'absolute',
                left: '8px',
                zIndex: 10,
            }}>
                <button
                    data-cy="add-empty-pattern-btn"
                    onClick={onCreateEmptyPattern}
                    style={{
                        width: '40px',
                        height: '40px',
                        minWidth: '40px',
                        minHeight: '40px',
                        borderRadius: '50%',
                        backgroundColor: COLORS.PRIMARY,
                        color: '#fff',
                        border: 'none',
                        fontSize: '28px',
                        fontWeight: 'normal',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '0',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                        transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                        e.target.style.backgroundColor = '#b52300';
                        e.target.style.transform = 'scale(1.15)';
                    }}
                    onMouseLeave={(e) => {
                        e.target.style.backgroundColor = COLORS.PRIMARY;
                        e.target.style.transform = 'scale(1)';
                    }}
                >
                    +
                </button>
            </div>

            {/* Контейнер с паттернами и скроллом */}
            <div 
                className="custom-scrollbar-left"
                style={{
                    flex: 1,
                    overflowY: 'auto',
                    paddingRight: '12px',
                    marginRight: '8px',
                    display: 'flex',
                    flexDirection: 'column',
                    paddingTop: '40px',
                }}
            >
                {Object.entries(patterns).map(([patternId, pattern], index) => {
                    const isPatternSelected = selectedPatternId === patternId;
                    const properties = getPatternProperties(pattern, ['inner', 'outer', 'extends']);
            
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
        </div>
    );
};

export { LeftSidebar };

