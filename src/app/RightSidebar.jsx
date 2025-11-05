import React, { useState } from 'react';
import { getPatternProperties, valueToString, stringToValue } from './utils.js';
import { buttonStyles, inputStyles, textStyles } from './styles.js';
import './mainWindow.css';

/**
 * Компонент правого sidebar
 * Отображает и позволяет редактировать выбранный паттерн
 */
const RightSidebar = ({ selectedPattern, selectedPatternId, onUpdatePattern, onSavePattern, onCancelPattern }) => {
    const [localPattern, setLocalPattern] = useState(selectedPattern || {});
    const [localPatternId, setLocalPatternId] = useState(selectedPatternId || '');

    React.useEffect(() => {
        setLocalPattern(selectedPattern || {});
        setLocalPatternId(selectedPatternId || '');
    }, [selectedPattern, selectedPatternId]);

    if (!selectedPattern || !selectedPatternId) {
        return (
            <div style={{
                width: '300px',
                minWidth: '300px',
                flexShrink: 0,
                backgroundColor: 'transparent',
                padding: '0',
                height: 'calc(100vh - 120px)',
            }}>
                <div style={{ color: '#999', textAlign: 'center', marginTop: '50%' }}>
                    Выберите паттерн для редактирования
                </div>
            </div>
        );
    }

    // Функция для обновления свойства паттерна
    const updateProperty = (key, value) => {
        setLocalPattern(prev => ({
            ...prev,
            [key]: value,
        }));
    };

    // Функция для добавления нового свойства
    const addProperty = () => {
        const newKey = prompt('Введите название свойства:');
        if (newKey && newKey.trim()) {
            setLocalPattern(prev => ({
                ...prev,
                [newKey.trim()]: '',
            }));
        }
    };

    // Функция для удаления свойства
    const deleteProperty = (key) => {
        if (confirm(`Удалить свойство "${key}"?`)) {
            setLocalPattern(prev => {
                const newPattern = { ...prev };
                delete newPattern[key];
                delete newPattern.id; // Убираем служебное поле id
                return newPattern;
            });
        }
    };

    const handleSave = () => {
        if (onSavePattern) {
            const patternToSave = { ...localPattern };
            delete patternToSave.id; // Убираем служебное поле id
            onSavePattern({
                oldId: selectedPatternId,
                newId: localPatternId,
                pattern: patternToSave,
            });
        }
    };

    const handleCancel = () => {
        setLocalPattern(selectedPattern);
        setLocalPatternId(selectedPatternId);
        if (onCancelPattern) {
            onCancelPattern();
        }
    };

    // Получаем все свойства паттерна для редактирования (кроме служебных)
    const editableProperties = getPatternProperties(localPattern, ['id']);

    return (
        <div style={{
            width: '300px',
            minWidth: '300px',
            flexShrink: 0,
            backgroundColor: 'transparent',
            padding: '0',
            height: 'calc(100vh - 120px)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
        }}>
            <div style={{
                marginBottom: '20px',
                flexShrink: 0,
            }}>
                <div style={{
                    fontWeight: 'bold',
                    fontSize: '14px',
                    marginBottom: '8px',
                    color: '#666',
                }}>
                    Название паттерна:
                </div>
                <input
                    type="text"
                    value={localPatternId}
                    onChange={(e) => setLocalPatternId(e.target.value)}
                    placeholder="Введите название паттерна"
                    style={{
                        width: '100%',
                        padding: '8px',
                        borderRadius: '4px',
                        border: '1px solid #ddd',
                        fontSize: '16px',
                        fontWeight: 'bold',
                        fontFamily: 'inherit',
                    }}
                />
            </div>

            {/* Свойства паттерна */}
            <div 
                className="custom-scrollbar-inner"
                style={{ 
                    flex: 1,
                    overflowY: 'auto',
                    marginBottom: '20px',
                }}
            >
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '15px',
                }}>
                    <div style={{ fontWeight: 'bold', fontSize: '16px', color: '#333' }}>
                        Свойства
                    </div>
                    <button
                        onClick={addProperty}
                        style={buttonStyles.icon}
                    >
                        +
                    </button>
                </div>

                {editableProperties.map(([key, value]) => (
                    <div
                        key={key}
                        style={{
                            marginBottom: '15px',
                            padding: '12px',
                            backgroundColor: '#ffffff',
                            borderRadius: '8px',
                        }}
                    >
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '8px',
                        }}>
                            <div style={{
                                fontWeight: 'bold',
                                color: '#333',
                                fontSize: '14px',
                            }}>
                                {key}:
                            </div>
                            <button
                                onClick={() => deleteProperty(key)}
                                style={{
                                    backgroundColor: 'transparent',
                                    border: 'none',
                                    cursor: 'pointer',
                                    color: '#999',
                                    fontSize: '14px',
                                    padding: '2px 4px',
                                }}
                            >
                                🗑️
                            </button>
                        </div>
                        <textarea
                            value={valueToString(value)}
                            onChange={(e) => updateProperty(key, stringToValue(e.target.value, value))}
                            placeholder={`Введите значение для ${key}`}
                                    style={inputStyles.textarea}
                        />
                    </div>
                ))}

                {editableProperties.length === 0 && (
                    <div style={{
                        padding: '20px',
                        textAlign: 'center',
                        color: '#999',
                        fontStyle: 'italic',
                    }}>
                        Нет свойств. Нажмите + для добавления.
                    </div>
                )}
            </div>

            {/* Кнопки сохранения - всегда видимы внизу */}
            <div style={{
                flexShrink: 0,
                paddingTop: '20px',
                display: 'flex',
                gap: '10px',
                borderTop: '1px solid #eee',
            }}>
                <button
                    onClick={handleSave}
                    style={buttonStyles.save}
                >
                    ✓ Сохранить
                </button>
                <button
                    onClick={handleCancel}
                    style={buttonStyles.cancel}
                >
                    ✕ Отмена
                </button>
            </div>
        </div>
    );
};

export { RightSidebar };

