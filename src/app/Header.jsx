import React from 'react';
import { parse } from 'yaml';

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
                            content = parse(fileContent);
                        } else {
                            content = JSON.parse(fileContent);
                        }
                        
                        onOpen(content, file.name);
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

    const handleExport = () => {
        if (onExport) {
            onExport();
        }
    };

    return (
        <div style={{
            width: '100%',
            backgroundColor: '#ffffff',
            padding: '12px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '20px',
            boxSizing: 'border-box',
        }}>
            {/* Оранжевый овал с кнопками */}
            <div style={{
                backgroundColor: '#D72B00',
                borderRadius: '50px',
                padding: '8px 24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0',
                flex: '1',
                maxWidth: '600px',
            }}>
                <button
                    onClick={handleOpen}
                    style={{
                        backgroundColor: 'transparent',
                        color: '#ffffff',
                        border: 'none',
                        padding: '8px 16px',
                        fontSize: '16px',
                        cursor: 'pointer',
                        fontWeight: '500',
                        fontFamily: 'inherit',
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
                        fontSize: '16px',
                        cursor: 'pointer',
                        fontWeight: '500',
                        fontFamily: 'inherit',
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
                        fontSize: '16px',
                        cursor: 'pointer',
                        fontWeight: '500',
                        fontFamily: 'inherit',
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
                        fontSize: '16px',
                        cursor: 'pointer',
                        fontWeight: '500',
                        fontFamily: 'inherit',
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

            {/* Белый овал с оранжевым контуром для названия файла */}
            <div style={{
                backgroundColor: '#ffffff',
                border: '1px solid #D72B00',
                borderRadius: '50px',
                padding: '8px 20px',
                display: 'flex',
                alignItems: 'center',
                minWidth: '200px',
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
                        fontSize: '16px',
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

