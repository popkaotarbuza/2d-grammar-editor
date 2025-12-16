import React, { useState, forwardRef, useImperativeHandle } from 'react';
import { getPatternProperties, valueToString, stringToValue } from './utils.js';
import { buttonStyles, inputStyles, textStyles } from './styles.js';
import './mainWindow.css';

/**
 * Компонент для редактирования location
 */
const LocationEditor = ({ location, onLocationChange }) => {
    const sides = ['top', 'right', 'bottom', 'left'];
    const sideLabels = {
        top: '↑ Верх',
        right: '→ Право',
        bottom: '↓ Низ',
        left: '← Лево'
    };

    const [isEditing, setIsEditing] = useState(false);
    const [localLocation, setLocalLocation] = useState(location || {});

    React.useEffect(() => {
        setLocalLocation(location || {});
    }, [location]);

    const handleSideChange = (side, value) => {
        const newLocation = { ...localLocation };
        if (value === '' || value === null || value === undefined) {
            delete newLocation[side];
        } else {
            newLocation[side] = value;
        }
        setLocalLocation(newLocation);
    };

    const handleSave = () => {
        onLocationChange(localLocation);
        setIsEditing(false);
    };

    const handleCancel = () => {
        setLocalLocation(location || {});
        setIsEditing(false);
    };

    const hasValues = sides.some(side => localLocation[side] !== undefined && localLocation[side] !== null);

    if (!isEditing) {
        return (
            <div style={{
                marginTop: '8px',
                padding: '8px',
                backgroundColor: '#f9f9f9',
                borderRadius: '4px',
                fontSize: '11px',
            }}>
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '6px',
                }}>
                    <div style={{
                        fontWeight: 'bold',
                        color: '#666',
                        fontSize: '12px',
                    }}>
                        Location:
                    </div>
                    <button
                        onClick={() => setIsEditing(true)}
                        style={{
                            backgroundColor: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            color: '#D72B00',
                            fontSize: '12px',
                            padding: '2px 4px',
                        }}
                    >
                        ✏️
                    </button>
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
                            const value = localLocation[side];
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
    }

    return (
        <div style={{
            marginTop: '8px',
            padding: '8px',
            backgroundColor: '#f0f8ff',
            borderRadius: '4px',
            border: '1px solid #D72B00',
        }}>
            <div style={{
                fontWeight: 'bold',
                marginBottom: '8px',
                color: '#666',
                fontSize: '12px',
            }}>
                Редактирование Location:
            </div>
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
            }}>
                {sides.map(side => (
                    <div key={side} style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                    }}>
                        <label style={{
                            minWidth: '60px',
                            fontSize: '11px',
                            color: '#666',
                        }}>
                            {sideLabels[side]}:
                        </label>
                        <input
                            type="text"
                            value={localLocation[side] || ''}
                            onChange={(e) => handleSideChange(side, e.target.value)}
                            placeholder="0, 0+, 0..2"
                            style={{
                                flex: 1,
                                padding: '4px 6px',
                                fontSize: '11px',
                                border: '1px solid #ddd',
                                borderRadius: '3px',
                                fontFamily: 'monospace',
                            }}
                        />
                    </div>
                ))}
            </div>
            <div style={{
                display: 'flex',
                gap: '6px',
                marginTop: '8px',
            }}>
                <button
                    onClick={handleSave}
                    style={{
                        flex: 1,
                        padding: '4px 8px',
                        fontSize: '11px',
                        backgroundColor: '#4CAF50',
                        color: 'white',
                        border: 'none',
                        borderRadius: '3px',
                        cursor: 'pointer',
                    }}
                >
                    ✓ Сохранить
                </button>
                <button
                    onClick={handleCancel}
                    style={{
                        flex: 1,
                        padding: '4px 8px',
                        fontSize: '11px',
                        backgroundColor: '#999',
                        color: 'white',
                        border: 'none',
                        borderRadius: '3px',
                        cursor: 'pointer',
                    }}
                >
                    ✕ Отмена
                </button>
            </div>
        </div>
    );
};

/**
 * Компонент правого sidebar
 * Отображает и позволяет редактировать выбранный паттерн
 */
const RightSidebar = forwardRef(
    (
        {
            selectedPattern,
            selectedPatternId,
            onUpdatePattern,
            onSavePattern,
            onCancelPattern,
            allPatterns = {}
        },
        ref
    ) => {

    
    
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

    const isEmpty = !selectedPattern || !selectedPatternId; // RETURN переместился

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

                // Проверка на существование компонента с таким именем
                if (currentInner[trimmedName]) {
                    alert('Компонент с таким именем уже существует');
                    return prev;
                }

                // Проверка на уникальность паттерна внутри inner
                const usedPatterns = Object.values(currentInner).map(item => item.pattern);
                if (usedPatterns.includes(trimmedId)) {
                    alert('Этот паттерн уже используется внутри компонента');
                    return prev;
                }

                // Если всё ок, добавляем новый компонент
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

                // Проверка на существование компонента с таким именем
                if (currentOuter[trimmedName]) {
                    alert('Компонент с таким именем уже существует');
                    return prev;
                }

                // Проверка на уникальность паттерна внутри outer
                const usedPatterns = Object.values(currentOuter).map(item => item.pattern);
                if (usedPatterns.includes(trimmedId)) {
                    alert('Этот паттерн уже используется внутри внешнего компонента');
                    return prev;
                }

                // Если всё ок, добавляем новый компонент
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
    if (!patternId || !patternId.trim()) return;

    const trimmedId = patternId.trim();

    if (!availablePatterns.includes(trimmedId)) {
        alert('Паттерн с таким ID не найден');
        return;
    }

    // Проверка: уже добавлен?
    const currentExtends = getExtends();
    if (currentExtends.includes(trimmedId)) {
        alert('Этот паттерн уже добавлен в extends');
        return;
    }

    // === ПРОВЕРКА НА ЦИКЛ ===
    // Строим граф: кто на кого ссылается
    const graph = {};
    Object.keys(allPatterns).forEach(id => {
        const ext = allPatterns[id].extends || [];
        graph[id] = ext.filter(e => typeof e === 'string');
    });

    // Добавляем текущую попытку: selectedPatternId → trimmedId
    const tempGraph = { ...graph, ...{[selectedPatternId]: [...graph[selectedPatternId] || [], trimmedId]}};

    // Проверяем, есть ли путь от trimmedId обратно к selectedPatternId
    const hasCycle = (start, target) => {
        const visited = new Set();
        const stack = [start];

        while (stack.length > 0) {
            const current = stack.pop();
            if (current === target) return true;
            if (visited.has(current)) continue;
            visited.add(current);

            const children = tempGraph[current] || [];
            for (const child of children) {
                stack.push(child);
            }
        }
        return false;
    };

    if (hasCycle(trimmedId, selectedPatternId)) {
        alert('Ошибка: создание циклической зависимости запрещено!');
        return;
    }

    // Если всё ок — добавляем
    setLocalPattern(prev => ({
        ...prev,
        extends: [...currentExtends, trimmedId]
    }));
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


    useImperativeHandle(ref, () => ({
        addInternalPattern,
        addExternalPattern,
    }));






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
        {isEmpty ? (
            <div style={{ color: '#999', textAlign: 'center', marginTop: '50%' }}>
                Выберите паттерн для редактирования
            </div>
        ) : (
            <>
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
                    {/* Свойства */}
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '15px',
                    }}>
                        <div style={{ fontWeight: 'bold', fontSize: '16px', color: '#333' }}>
                            Свойства
                        </div>
                        <button onClick={addProperty} style={buttonStyles.icon}>+</button>
                    </div>

                    {editableProperties.map(([key, value]) => (
                        <div key={key} style={{
                            marginBottom: '15px',
                            padding: '12px',
                            backgroundColor: '#ffffff',
                            borderRadius: '8px',
                        }}>
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: '8px',
                            }}>
                                <div style={{ fontWeight: 'bold', color: '#333', fontSize: '14px' }}>{key}:</div>
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
                        <div style={{ fontWeight: 'bold', fontSize: '16px', color: '#333' }}>Внутренние паттерны</div>
                        <button onClick={addInternalPattern} style={buttonStyles.icon}>+</button>
                    </div>

                    {Object.entries(getInternalPatterns()).map(([componentName, componentData]) => (
                        <div key={componentName} style={{
                            marginBottom: '15px',
                            padding: '12px',
                            backgroundColor: '#ffffff',
                            borderRadius: '8px',
                        }}>
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: '8px',
                            }}>
                                <div style={{ fontWeight: 'bold', color: '#333', fontSize: '14px' }}>{componentName}</div>
                                <button onClick={() => deleteInternalPattern(componentName)} style={{
                                    backgroundColor: 'transparent',
                                    border: 'none',
                                    cursor: 'pointer',
                                    color: '#999',
                                    fontSize: '14px',
                                    padding: '2px 4px',
                                }}>🗑️</button>
                            </div>
                            <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                                <strong>Pattern:</strong> {componentData.pattern || 'не указан'}
                            </div>
                            {componentData && <LocationDisplay location={componentData.location} />}
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
                        {componentData && (
                            <LocationEditor 
                                location={componentData.location} 
                                onLocationChange={(newLocation) => {
                                    setLocalPattern(prev => ({
                                        ...prev,
                                        inner: {
                                            ...prev.inner,
                                            [componentName]: {
                                                ...prev.inner[componentName],
                                                location: newLocation
                                            }
                                        }
                                    }));
                                }}
                            />
                        )}
                    </div>
                ))}

                    {/* Внешние паттерны */}
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginTop: '30px',
                        marginBottom: '15px',
                    }}>
                        <div style={{ fontWeight: 'bold', fontSize: '16px', color: '#333' }}>Внешние паттерны</div>
                        <button onClick={addExternalPattern} style={buttonStyles.icon}>+</button>
                    </div>

                    {Object.entries(getExternalPatterns()).map(([componentName, componentData]) => (
                        <div key={componentName} style={{
                            marginBottom: '15px',
                            padding: '12px',
                            backgroundColor: '#ffffff',
                            borderRadius: '8px',
                        }}>
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: '8px',
                            }}>
                                <div style={{ fontWeight: 'bold', color: '#333', fontSize: '14px' }}>{componentName}</div>
                                <button onClick={() => deleteExternalPattern(componentName)} style={{
                                    backgroundColor: 'transparent',
                                    border: 'none',
                                    cursor: 'pointer',
                                    color: '#999',
                                    fontSize: '14px',
                                    padding: '2px 4px',
                                }}>🗑️</button>
                            </div>
                            <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                                <strong>Pattern:</strong> {componentData.pattern || 'не указан'}
                            </div>
                            {componentData && <LocationDisplay location={componentData.location} />}
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
                        {componentData && (
                            <LocationEditor 
                                location={componentData.location} 
                                onLocationChange={(newLocation) => {
                                    setLocalPattern(prev => ({
                                        ...prev,
                                        outer: {
                                            ...prev.outer,
                                            [componentName]: {
                                                ...prev.outer[componentName],
                                                location: newLocation
                                            }
                                        }
                                    }));
                                }}
                            />
                        )}
                    </div>
                ))}

                    {/* Extends */}
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginTop: '30px',
                        marginBottom: '15px',
                    }}>
                        <div style={{ fontWeight: 'bold', fontSize: '16px', color: '#333' }}>Extends</div>
                        <button onClick={addExtend} style={buttonStyles.icon}>+</button>
                    </div>

                    {getExtends().map((patternId, index) => (
                        <div key={index} style={{
                            marginBottom: '10px',
                            padding: '10px',
                            backgroundColor: '#ffffff',
                            borderRadius: '8px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                        }}>
                            <span style={{ fontSize: '14px', color: '#333' }}>{patternId}</span>
                            <button onClick={() => deleteExtend(index)} style={{
                                backgroundColor: 'transparent',
                                border: 'none',
                                cursor: 'pointer',
                                color: '#999',
                                fontSize: '14px',
                                padding: '2px 4px',
                            }}>🗑️</button>
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

                {/* Кнопки сохранения */}
                <div style={{
                    flexShrink: 0,
                    paddingTop: '20px',
                    display: 'flex',
                    gap: '10px',
                    borderTop: '1px solid #eee',
                }}>
                    <button onClick={handleSave} style={buttonStyles.save}>✓ Сохранить</button>
                    <button onClick={handleCancel} style={buttonStyles.cancel}>✕ Отмена</button>
                </div>
            </>
        )}
    </div>
);

});

export { RightSidebar };