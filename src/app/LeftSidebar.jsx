import React from 'react';

const LeftSidebar = ({ patterns, selectedPatternId, selectedComponentId, onSelectPattern }) => {
    return (
        <div style={{
            width: '250px',
            minWidth: '250px',
            flexShrink: 0,
            backgroundColor: '#E3E3E3',
            padding: '20px',
            overflowY: 'auto',
            height: 'calc(100vh - 80px)',
            borderRadius: '12px',
        }}>
            {Object.entries(patterns).map(([patternId, pattern], index) => {
                const isPatternSelected = selectedPatternId === patternId;
                return (
                    <div 
                        key={patternId} 
                        style={{ 
                            marginBottom: '12px',
                            backgroundColor: '#ffffff',
                            borderRadius: '8px',
                            padding: '15px',
                        }}
                    >
                        <div style={{
                            fontWeight: 'bold',
                            marginBottom: '12px',
                            fontSize: '18px',
                            color: '#333',
                        }}>
                            Паттерн {index + 1}
                        </div>
                        <div>
                            {pattern.components && Object.keys(pattern.components).map((componentId, compIndex) => {
                                const isComponentSelected = isPatternSelected && selectedComponentId === componentId;
                                return (
                                    <div
                                        key={componentId}
                                        onClick={() => onSelectPattern && onSelectPattern(patternId, componentId)}
                                        style={{
                                            padding: '8px 12px',
                                            marginBottom: '4px',
                                            cursor: 'pointer',
                                            backgroundColor: isComponentSelected
                                                ? '#D72B00' 
                                                : 'transparent',
                                            color: isComponentSelected
                                                ? '#ffffff'
                                                : '#000000',
                                            borderRadius: '4px',
                                            transition: 'background-color 0.2s',
                                        }}
                                        onMouseEnter={(e) => {
                                            if (!isComponentSelected) {
                                                e.target.style.backgroundColor = '#f5f5f5';
                                            }
                                        }}
                                        onMouseLeave={(e) => {
                                            if (!isComponentSelected) {
                                                e.target.style.backgroundColor = 'transparent';
                                            }
                                        }}
                                    >
                                        Компонент {compIndex + 1}
                                    </div>
                                );
                            })}
                            {(!pattern.components || Object.keys(pattern.components).length === 0) && (
                                <div style={{
                                    padding: '8px 12px',
                                    color: '#999',
                                    fontStyle: 'italic',
                                    fontSize: '14px',
                                }}>
                                    Нет компонентов
                                </div>
                            )}
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

