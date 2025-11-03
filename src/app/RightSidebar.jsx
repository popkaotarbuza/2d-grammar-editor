import React, { useState } from 'react';

const RightSidebar = ({ selectedPattern, onUpdatePattern, onSavePattern, onCancelPattern }) => {
    const [localPattern, setLocalPattern] = useState(selectedPattern || {});

    React.useEffect(() => {
        setLocalPattern(selectedPattern || {});
    }, [selectedPattern]);

    if (!selectedPattern) {
        return (
            <div style={{
                width: '300px',
                minWidth: '300px',
                flexShrink: 0,
                backgroundColor: '#f0f0f0',
                padding: '20px',
                height: 'calc(100vh - 80px)',
            }}>
                <div style={{ color: '#999', textAlign: 'center', marginTop: '50%' }}>
                    Выберите паттерн для редактирования
                </div>
            </div>
        );
    }

    const updateComponent = (componentId, field, value) => {
        setLocalPattern(prev => ({
            ...prev,
            components: {
                ...prev.components,
                [componentId]: {
                    ...prev.components[componentId],
                    [field]: value,
                }
            }
        }));
    };

    const addComponent = () => {
        const newId = `component_${Date.now()}`;
        setLocalPattern(prev => ({
            ...prev,
            components: {
                ...prev.components || {},
                [newId]: {
                    description: '',
                    kind: 'area',
                    size: '',
                }
            }
        }));
    };

    const deleteComponent = (componentId) => {
        setLocalPattern(prev => {
            const newComponents = { ...prev.components };
            delete newComponents[componentId];
            return {
                ...prev,
                components: newComponents,
            };
        });
    };

    const handleSave = () => {
        if (onSavePattern) {
            onSavePattern(localPattern);
        }
    };

    const handleCancel = () => {
        setLocalPattern(selectedPattern);
        if (onCancelPattern) {
            onCancelPattern();
        }
    };

    const components = localPattern.components || {};

    return (
        <div style={{
            width: '300px',
            minWidth: '300px',
            flexShrink: 0,
            backgroundColor: '#f0f0f0',
            padding: '20px',
            overflowY: 'auto',
            height: 'calc(100vh - 80px)',
            display: 'flex',
            flexDirection: 'column',
        }}>
            <div style={{
                fontWeight: 'bold',
                fontSize: '18px',
                marginBottom: '20px',
                color: '#333',
            }}>
                {selectedPattern.name || 'Паттерн'}
            </div>

            {/* Свойства */}
            <div style={{ marginBottom: '30px' }}>
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '15px',
                }}>
                    <div style={{ fontWeight: 'bold', fontSize: '16px', color: '#333' }}>
                        Свойства
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button
                            onClick={addComponent}
                            style={{
                                backgroundColor: '#D72B00',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '4px',
                                padding: '4px 8px',
                                cursor: 'pointer',
                                fontSize: '18px',
                            }}
                        >
                            +
                        </button>
                    </div>
                </div>

                {Object.entries(components).map(([componentId, component], index) => {
                    const isSelected = selectedPattern.selectedComponentId === componentId;
                    return (
                        <div
                            key={componentId}
                            style={{
                                marginBottom: '15px',
                                padding: '12px',
                                backgroundColor: isSelected ? '#D72B00' : '#ffffff',
                                borderRadius: '8px',
                                cursor: 'pointer',
                            }}
                            onClick={() => {
                                if (onUpdatePattern) {
                                    onUpdatePattern({
                                        ...selectedPattern,
                                        selectedComponentId: componentId,
                                    });
                                }
                            }}
                        >
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: '10px',
                            }}>
                                <div style={{
                                    fontWeight: 'bold',
                                    color: isSelected ? '#fff' : '#333',
                                }}>
                                    Компонент {index + 1}
                                </div>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        deleteComponent(componentId);
                                    }}
                                    style={{
                                        backgroundColor: 'transparent',
                                        border: 'none',
                                        cursor: 'pointer',
                                        color: isSelected ? '#fff' : '#999',
                                        fontSize: '16px',
                                    }}
                                >
                                    🗑️
                                </button>
                            </div>

                            <input
                                type="text"
                                value={component.description || ''}
                                onChange={(e) => updateComponent(componentId, 'description', e.target.value)}
                                placeholder="Описание"
                                style={{
                                    width: '100%',
                                    padding: '6px',
                                    marginBottom: '8px',
                                    borderRadius: '4px',
                                    border: '1px solid #ddd',
                                    fontSize: '14px',
                                }}
                            />

                            <input
                                type="text"
                                value={component.kind || ''}
                                onChange={(e) => updateComponent(componentId, 'kind', e.target.value)}
                                placeholder="kind (area/cell/array)"
                                style={{
                                    width: '100%',
                                    padding: '6px',
                                    marginBottom: '8px',
                                    borderRadius: '4px',
                                    border: '1px solid #ddd',
                                    fontSize: '14px',
                                }}
                            />

                            <input
                                type="text"
                                value={component.size || ''}
                                onChange={(e) => updateComponent(componentId, 'size', e.target.value)}
                                placeholder="size (например: 5+ x 59+)"
                                style={{
                                    width: '100%',
                                    padding: '6px',
                                    marginBottom: '8px',
                                    borderRadius: '4px',
                                    border: '1px solid #ddd',
                                    fontSize: '14px',
                                }}
                            />
                        </div>
                    );
                })}

                {Object.keys(components).length === 0 && (
                    <div style={{
                        padding: '20px',
                        textAlign: 'center',
                        color: '#999',
                        fontStyle: 'italic',
                    }}>
                        Нет компонентов. Нажмите + для добавления.
                    </div>
                )}
            </div>

            {/* Внутренние паттерны */}
            <div style={{ marginBottom: '30px' }}>
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '15px',
                }}>
                    <div style={{ fontWeight: 'bold', fontSize: '16px', color: '#333' }}>
                        Внутренние паттерны
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button
                            style={{
                                backgroundColor: '#D72B00',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '4px',
                                padding: '4px 8px',
                                cursor: 'pointer',
                                fontSize: '18px',
                            }}
                        >
                            +
                        </button>
                    </div>
                </div>
                <div style={{ color: '#999', fontStyle: 'italic' }}>
                    Компонент 1, Компонент 2
                </div>
            </div>

            {/* Внешние паттерны */}
            <div style={{ marginBottom: '30px' }}>
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '15px',
                }}>
                    <div style={{ fontWeight: 'bold', fontSize: '16px', color: '#333' }}>
                        Внешние паттерны
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button
                            style={{
                                backgroundColor: '#D72B00',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '4px',
                                padding: '4px 8px',
                                cursor: 'pointer',
                                fontSize: '18px',
                            }}
                        >
                            +
                        </button>
                    </div>
                </div>
                <div style={{ color: '#999', fontStyle: 'italic' }}>
                    Компонент 1, Компонент 2
                </div>
            </div>

            {/* Кнопки сохранения */}
            <div style={{
                marginTop: 'auto',
                paddingTop: '20px',
                display: 'flex',
                gap: '10px',
            }}>
                <button
                    onClick={handleSave}
                    style={{
                        flex: 1,
                        backgroundColor: '#D72B00',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '12px',
                        cursor: 'pointer',
                        fontSize: '16px',
                        fontWeight: 'bold',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                    }}
                >
                    ✓ Сохранить
                </button>
                <button
                    onClick={handleCancel}
                    style={{
                        flex: 1,
                        backgroundColor: '#fff',
                        color: '#333',
                        border: '1px solid #ddd',
                        borderRadius: '8px',
                        padding: '12px',
                        cursor: 'pointer',
                        fontSize: '16px',
                        fontWeight: 'bold',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                    }}
                >
                    ✕ Отмена
                </button>
            </div>
        </div>
    );
};

export { RightSidebar };

