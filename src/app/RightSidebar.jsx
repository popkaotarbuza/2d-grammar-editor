import React, { useState } from 'react';
import { getPatternProperties, valueToString, stringToValue } from './utils.js';
import { buttonStyles, inputStyles, textStyles } from './styles.js';
import './mainWindow.css';

/**
 * Компонент для красивого отображения location
 */
const LocationDisplay = ({ location }) => {
    const sides = ['top', 'right', 'bottom', 'left'];
    const sideLabels = {
        top: '↑ Верх',
        right: '→ Право',
        bottom: '↓ Низ',
        left: '← Лево'
    };

    // Проверяем наличие location и что это объект с данными
    let locationData = {};
    let hasValues = false;

    if (location && typeof location === 'object' && !Array.isArray(location)) {
        locationData = location;
        hasValues = sides.some(side => locationData[side] !== undefined && locationData[side] !== null);
    }

    return (
        <div style={{
            marginTop: '8px',
            padding: '8px',
            backgroundColor: '#f9f9f9',
            borderRadius: '4px',
            fontSize: '11px',
        }}>
            <div style={{
                fontWeight: 'bold',
                marginBottom: '6px',
                color: '#666',
                fontSize: '12px',
            }}>
                Location:
            </div>
            {!hasValues ? (
                <div style={{
                    color: '#999',
                    fontStyle: 'italic',
                    fontSize: '11px',
                }}>
                    не задан
                </div>
            ) : (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '4px',
                }}>
                    {sides.map(side => {
                        const value = locationData[side];
                        if (value === undefined || value === null) return null;
                        
                        return (
                            <div 
                                key={side}
                                style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    padding: '2px 4px',
                                }}
                            >
                                <span style={{ color: '#666' }}>{sideLabels[side]}:</span>
                                <span style={{ 
                                    fontWeight: 'bold', 
                                    color: '#333',
                                    fontFamily: 'monospace',
                                }}>
                                    {String(value)}
                                </span>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

/**
 * Компонент правого sidebar
 * Отображает и позволяет редактировать выбранный паттерн
 */
const RightSidebar = ({ selectedPattern, selectedPatternId, onUpdatePattern, onSavePattern, onCancelPattern, allPatterns = {} }) => {
    
    console.log("RIGHT SIDEBAR pattern:", selectedPattern);  // ОТЛАДОЧНАЯ СТРОКА
    
    const [localPattern, setLocalPattern] = useState(selectedPattern || {});
    const [localPatternId, setLocalPatternId] = useState(selectedPatternId || '');
    const [originalPatternId, setOriginalPatternId] = useState(selectedPatternId || "");

    React.useEffect(() => {
        const pattern = selectedPattern || {};
        // Инициализируем inner и outer как объекты, если они не существуют или не являются объектами
        const initializedPattern = {
            ...pattern,
            inner: (pattern.inner && typeof pattern.inner === 'object' && !Array.isArray(pattern.inner)) 
                ? pattern.inner 
                : {},
            outer: (pattern.outer && typeof pattern.outer === 'object' && !Array.isArray(pattern.outer)) 
                ? pattern.outer 
                : {},
            extends: Array.isArray(pattern.extends) ? pattern.extends : [],
        };

        console.log("INITIALIZED pattern:", initializedPattern); // ОТЛАДОЧНАЯ

        setLocalPattern(initializedPattern);
        setLocalPatternId(selectedPatternId || '');
    }, [selectedPattern, selectedPatternId]);

    React.useEffect(() => {
            setOriginalPatternId(selectedPatternId || "");
        }, [selectedPatternId]);

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




    // НЕЛЬЗЯ ДОБАВЛЯТЬ СВОЙСТВА С ТАКИМИ ИМЕНАМИ
    const RESERVED_KEYS = ['extends', 'inner', 'outer'];

    // Функция для добавления нового свойства
    const addProperty = () => {
        const newKey = prompt('Введите название свойства:');
        if (!newKey || !newKey.trim()) {
            return; // пустая строка — игнор
        }

        const trimmedKey = newKey.trim();

        // Проверка на спецсимволы (можно убрать если не нужно)
        if (!/^[a-zA-Z0-9_]+$/.test(trimmedKey)) {
            alert('Название свойства может содержать только буквы, цифры и _.');
            return;
        }

        setLocalPattern(prev => {

            // Запрещённые ключи
            if (RESERVED_KEYS.includes(trimmedKey)) {
                alert(`"${trimmedKey}" — зарезервированное имя и не может быть свойством.`);
                return prev;
            }

            // Предотвращаем дубликаты
            else if (trimmedKey in prev) {
                alert('Свойство с таким именем уже существует.');
                return prev;
            }

            return {
                ...prev,
                [trimmedKey]: '',
            };
        });
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

    // Функции для работы с внутренними паттернами
    const getInternalPatterns = () => {
        const inner = localPattern.inner || {};
        return typeof inner === 'object' && !Array.isArray(inner) ? inner : {};
    };

    const addInternalPattern = () => {
        const availablePatterns = Object.keys(allPatterns).filter(id => id !== selectedPatternId);
        if (availablePatterns.length === 0) {
            alert('Нет доступных паттернов для добавления');
            return;
        }
        
        const componentName = prompt(`Введите имя компонента:`);
        if (!componentName || !componentName.trim()) {
            return;
        }
        
        const patternId = prompt(`Введите ID паттерна (доступные: ${availablePatterns.join(', ')})`);
        if (patternId && patternId.trim() && availablePatterns.includes(patternId.trim())) {
            const trimmedName = componentName.trim();
            const trimmedId = patternId.trim();
            setLocalPattern(prev => {
                const currentInner = (prev.inner && typeof prev.inner === 'object' && !Array.isArray(prev.inner)) 
                    ? prev.inner 
                    : {};
                if (!currentInner[trimmedName]) {
                    return {
                        ...prev,
                        inner: {
                            ...currentInner,
                            [trimmedName]: {
                                pattern: trimmedId,
                                location: {}
                            }
                        }
                    };
                } else {
                    alert('Компонент с таким именем уже существует');
                    return prev;
                }
            });
        } else if (patternId && patternId.trim()) {
            alert('Паттерн с таким ID не найден');
        }
    };

    const deleteInternalPattern = (componentName) => {
        if (confirm(`Удалить внутренний паттерн "${componentName}"?`)) {
            setLocalPattern(prev => {
                const currentInner = (prev.inner && typeof prev.inner === 'object' && !Array.isArray(prev.inner)) 
                    ? prev.inner 
                    : {};
                const newInner = { ...currentInner };
                delete newInner[componentName];
                return {
                    ...prev,
                    inner: newInner
                };
            });
        }
    };

    // Функции для работы с внешними паттернами
    const getExternalPatterns = () => {
        const outer = localPattern.outer || {};
        return typeof outer === 'object' && !Array.isArray(outer) ? outer : {};
    };

    const addExternalPattern = () => {
        const availablePatterns = Object.keys(allPatterns).filter(id => id !== selectedPatternId);
        if (availablePatterns.length === 0) {
            alert('Нет доступных паттернов для добавления');
            return;
        }
        
        const componentName = prompt(`Введите имя компонента:`);
        if (!componentName || !componentName.trim()) {
            return;
        }
        
        const patternId = prompt(`Введите ID паттерна (доступные: ${availablePatterns.join(', ')})`);
        if (patternId && patternId.trim() && availablePatterns.includes(patternId.trim())) {
            const trimmedName = componentName.trim();
            const trimmedId = patternId.trim();
            setLocalPattern(prev => {
                const currentOuter = (prev.outer && typeof prev.outer === 'object' && !Array.isArray(prev.outer)) 
                    ? prev.outer 
                    : {};
                if (!currentOuter[trimmedName]) {
                    return {
                        ...prev,
                        outer: {
                            ...currentOuter,
                            [trimmedName]: {
                                pattern: trimmedId,
                                location: {}
                            }
                        }
                    };
                } else {
                    alert('Компонент с таким именем уже существует');
                    return prev;
                }
            });
        } else if (patternId && patternId.trim()) {
            alert('Паттерн с таким ID не найден');
        }
    };

    const deleteExternalPattern = (componentName) => {
        if (confirm(`Удалить внешний паттерн "${componentName}"?`)) {
            setLocalPattern(prev => {
                const currentOuter = (prev.outer && typeof prev.outer === 'object' && !Array.isArray(prev.outer)) 
                    ? prev.outer 
                    : {};
                const newOuter = { ...currentOuter };
                delete newOuter[componentName];
                return {
                    ...prev,
                    outer: newOuter
                };
            });
        }
    };





    // === extends ===
    const getExtends = () => Array.isArray(localPattern.extends) ? localPattern.extends : [];

    const addExtend = () => {
        const availablePatterns = Object.keys(allPatterns).filter(id => id !== selectedPatternId);
        if (availablePatterns.length === 0) {
            alert('Нет доступных паттернов для добавления');
            return;
        }

        const patternId = prompt(`Введите ID паттерна для extends (доступные: ${availablePatterns.join(', ')})`);
        if (patternId && availablePatterns.includes(patternId.trim())) {
            const trimmedId = patternId.trim();
            setLocalPattern(prev => ({
                ...prev,
                extends: [...getExtends(), trimmedId]
            }));
        } else {
            alert('Паттерн с таким ID не найден');
        }
    };

    const deleteExtend = (index) => {
        setLocalPattern(prev => {
            const list = [...getExtends()];
            list.splice(index, 1);
            return {
                ...prev,
                extends: list
            };
        });
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
    const editableProperties = getPatternProperties(localPattern, ['id', 'inner', 'outer', 'extends']);

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
                onBlur={() => {
                    const newId = localPatternId.trim();
                    if (!newId) {
                        alert("Имя паттерна не может быть пустым");
                        setLocalPatternId(originalPatternId);
                        return;
                    }

                    if (newId !== originalPatternId && allPatterns[newId]) {
                        alert("Паттерн с таким именем уже существует");
                        setLocalPatternId(originalPatternId);
                    }
                }}
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

                {/* Внутренние паттерны */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginTop: '30px',
                    marginBottom: '15px',
                }}>
                    <div style={{ fontWeight: 'bold', fontSize: '16px', color: '#333' }}>
                        Внутренние паттерны
                    </div>
                    <button
                        onClick={addInternalPattern}
                        style={buttonStyles.icon}
                    >
                        +
                    </button>
                </div>

                {Object.entries(getInternalPatterns()).map(([componentName, componentData]) => (
                    <div
                        key={componentName}
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
                                {componentName}
                            </div>
                            <button
                                onClick={() => deleteInternalPattern(componentName)}
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
                        <div style={{
                            fontSize: '12px',
                            color: '#666',
                            marginBottom: '4px',
                        }}>
                            <strong>Pattern:</strong> {componentData.pattern || 'не указан'}
                        </div>
                        {componentData && (
                            <LocationDisplay location={componentData.location} />
                        )}
                    </div>
                ))}

                {Object.keys(getInternalPatterns()).length === 0 && (
                    <div style={{
                        padding: '20px',
                        textAlign: 'center',
                        color: '#999',
                        fontStyle: 'italic',
                    }}>
                        Нет внутренних паттернов. Нажмите + для добавления.
                    </div>
                )}

                {/* Внешние паттерны */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginTop: '30px',
                    marginBottom: '15px',
                }}>
                    <div style={{ fontWeight: 'bold', fontSize: '16px', color: '#333' }}>
                        Внешние паттерны
                    </div>
                    <button
                        onClick={addExternalPattern}
                        style={buttonStyles.icon}
                    >
                        +
                    </button>
                </div>

                {Object.entries(getExternalPatterns()).map(([componentName, componentData]) => (
                    <div
                        key={componentName}
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
                                {componentName}
                            </div>
                            <button
                                onClick={() => deleteExternalPattern(componentName)}
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
                        <div style={{
                            fontSize: '12px',
                            color: '#666',
                            marginBottom: '4px',
                        }}>
                            <strong>Pattern:</strong> {componentData.pattern || 'не указан'}
                        </div>
                        {componentData && (
                            <LocationDisplay location={componentData.location} />
                        )}
                    </div>
                ))}

                {Object.keys(getExternalPatterns()).length === 0 && (
                    <div style={{
                        padding: '20px',
                        textAlign: 'center',
                        color: '#999',
                        fontStyle: 'italic',
                    }}>
                        Нет внешних паттернов. Нажмите + для добавления.
                    </div>
                )}



                {/* Extends */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: '30px',
                marginBottom: '15px',
            }}>
                <div style={{ fontWeight: 'bold', fontSize: '16px', color: '#333' }}>
                    Extends
                </div>
                <button
                    onClick={addExtend}
                    style={buttonStyles.icon}
                >
                    +
                </button>
            </div>

            {getExtends().map((patternId, index) => (
                <div
                    key={index}
                    style={{
                        marginBottom: '10px',
                        padding: '10px',
                        backgroundColor: '#ffffff',
                        borderRadius: '8px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                    }}
                >
                    <span style={{ fontSize: '14px', color: '#333' }}>
                        {patternId}
                    </span>
                    <button
                        onClick={() => deleteExtend(index)}
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
            ))}

            {getExtends().length === 0 && (
                <div style={{
                    padding: '20px',
                    textAlign: 'center',
                    color: '#999',
                    fontStyle: 'italic',
                }}>
                    Нет наследуемых паттернов. Нажмите + для добавления.
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

