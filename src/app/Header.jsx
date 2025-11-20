import React from 'react';
import { parse } from 'yaml';
import { extractPatterns } from '../entities/import-yaml.js'
import { cleanEmptyPatternComponents } from '../entities/import-yaml.js'

const Header = ({ onOpen, onSave, onSaveAs, onExport, fileName, onFileNameChange }) => {
    const handleOpen = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json,.yaml';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file && onOpen) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    try {
                        const fileContent = event.target.result;
                        let content;
                        
                        if (file.name.endsWith('.yaml') || file.name.endsWith('.yml')) {
                            
                            // Для YAML файлов: парсим и извлекаем паттерны
                            const parsedYaml = parse(fileContent);
                            const cleaned = cleanEmptyPatternComponents(parsedYaml);

                            // Берём только корректный объект паттернов
                            const patterns = extractPatterns(cleaned?.patterns || {});

                            content = {
                                patterns: patterns,
                                blocks: []
                            };
                        } else {
                            // Для JSON файлов: парсим напрямую
                            content = JSON.parse(fileContent);
                        }
                        
                        onOpen(content, file.name);
                        
                        console.log('Загружен файл:', file.name);
                        console.log('Паттерны:', content.patterns);
                    } catch (error) {
                        console.error('Ошибка при чтении файла:', error);
                        alert('Не удалось открыть файл: ' + error.message);
                    }
                };
                reader.readAsText(file);
            }
        };
        input.click();
    };

    const handleSave = () => {
        if (onSave) {
            onSave();
        }
    };

    const handleSaveAs = () => {
        if (onSaveAs) {
            onSaveAs();
        }
    };

    const handleExport = () => { // Из JSON в YAML Обратно
        if (onExport) {
            onExport();
        }
    };

    return (
        <div style={{
            width: '100%',
            backgroundColor: 'transparent',
            padding: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '30px',
            boxSizing: 'border-box',
        }}>
            {/* Горизонтальный оранжевый овал с кнопками */}
            <div style={{
                backgroundColor: '#D72B00',
                borderRadius: '50px',
                padding: '12px 40px',
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '20px',
                flex: '1',
                maxWidth: '90%',
                height: '48px',
                boxSizing: 'border-box',
            }}>
                <button
                    onClick={handleOpen}
                    style={{
                        backgroundColor: 'transparent',
                        color: '#ffffff',
                        border: 'none',
                        padding: '8px 16px',
                        fontSize: '22px',
                        cursor: 'pointer',
                        fontWeight: '500',
                        fontFamily: 'Inter, sans-serif',
                    }}
                    onMouseEnter={(e) => {
                        e.target.style.opacity = '0.8';
                    }}
                    onMouseLeave={(e) => {
                        e.target.style.opacity = '1';
                    }}
                >
                    Открыть
                </button>
                <button
                    onClick={handleSave}
                    style={{
                        backgroundColor: 'transparent',
                        color: '#ffffff',
                        border: 'none',
                        padding: '8px 16px',
                        fontSize: '22px',
                        cursor: 'pointer',
                        fontWeight: '500',
                        fontFamily: 'Inter, sans-serif',
                    }}
                    onMouseEnter={(e) => {
                        e.target.style.opacity = '0.8';
                    }}
                    onMouseLeave={(e) => {
                        e.target.style.opacity = '1';
                    }}
                >
                    Сохранить
                </button>
                <button
                    onClick={handleSaveAs}
                    style={{
                        backgroundColor: 'transparent',
                        color: '#ffffff',
                        border: 'none',
                        padding: '8px 16px',
                        fontSize: '22px',
                        cursor: 'pointer',
                        fontWeight: '500',
                        fontFamily: 'Inter, sans-serif',
                    }}
                    onMouseEnter={(e) => {
                        e.target.style.opacity = '0.8';
                    }}
                    onMouseLeave={(e) => {
                        e.target.style.opacity = '1';
                    }}
                >
                    Сохранить как
                </button>
                <button
                    onClick={handleExport}
                    style={{
                        backgroundColor: 'transparent',
                        color: '#ffffff',
                        border: 'none',
                        padding: '8px 16px',
                        fontSize: '22px',
                        cursor: 'pointer',
                        fontWeight: '500',
                        fontFamily: 'Inter, sans-serif',
                    }}
                    onMouseEnter={(e) => {
                        e.target.style.opacity = '0.8';
                    }}
                    onMouseLeave={(e) => {
                        e.target.style.opacity = '1';
                    }}
                >
                    Экспорт
                </button>
            </div>

            {/* Поле ввода с оранжевой обводкой */}
            <div style={{
                backgroundColor: '#ffffff',
                border: '2px solid #D72B00',
                borderRadius: '50px',
                padding: '12px 30px',
                display: 'flex',
                alignItems: 'center',
                minWidth: '300px',
                height: '48px',
                boxSizing: 'border-box',
            }}>
                <input
                    type="text"
                    value={fileName}
                    onChange={(e) => onFileNameChange && onFileNameChange(e.target.value)}
                    placeholder="Название файла"
                    style={{
                        width: '100%',
                        padding: '0',
                        margin: '0',
                        fontSize: '18px',
                        border: 'none',
                        backgroundColor: 'transparent',
                        color: '#000000',
                        outline: 'none',
                        fontFamily: 'inherit',
                        fontWeight: '500',
                    }}
                />
            </div>
        </div>
    );
};

export { Header };

