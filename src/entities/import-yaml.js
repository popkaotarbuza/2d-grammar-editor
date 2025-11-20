
// Функция для извлечения паттернов из YAML данных
// Функция для извлечения паттернов из YAML данных
function extractPatterns(yamlData, patterns = {}) {
    if ('patterns' in yamlData) {
        yamlData = yamlData.patterns; // берём только содержимое
    }
    for (const [name, properties] of Object.entries(yamlData)) {
        if (!properties || typeof properties !== 'object' || Array.isArray(properties)) continue;

    // === ПРОВЕРКА УНИКАЛЬНОСТИ ИМЕНИ ===
    if (patterns[name] !== undefined) {
        throw new Error(`Паттерн с именем "${name}" уже существует. Выберите другое имя.`);
    }

        // Создаём паттерн с 4 обязательными полями
        patterns[name] = {
            kind: null,
            size: null,
            inner: { }, // для  pattern: , location: для каждого дочернего паттерна
            outer: { }
        };

        // === ПЕРВЫЙ ПРОХОД: kind + pattern_definition
        if ('pattern_definition' in properties) {
            let item_pattern_value = null;
            let hasArrayKind = false;

            const def = properties.pattern_definition;

            for (const [k, v] of Object.entries(def)) {
                if (k === 'kind') {
                    patterns[name].kind = v;
                    if (v === 'array') {
                        hasArrayKind = true;
                    }
                } else if (hasArrayKind && k === 'item_pattern') {
                    item_pattern_value = v;
                } else {
                    patterns[name][k] = v; // выносим на верхний уровень
                }
            }
            patterns[name].item_pattern = item_pattern_value;
        }

        // === ВТОРОЙ ПРОХОД: Обходим свойства inner, outer, location
        for (const [key, value] of Object.entries(properties)) {
            if (key === 'inner' || key === 'outer') {
                const container = patterns[name][key];

                for (const [childName, childProps] of Object.entries(value)) {
                    // Добавляем в container
                    container[childName] = {
                        pattern: null,
                        location: null
                    };

                    if (childProps.pattern !== undefined) {
                        container[childName].pattern = childProps.pattern;
                    }

                    // === НОРМАЛИЗАЦИЯ location ===
                    if (childProps.location !== undefined) {
                        const loc = childProps.location;
                        const result = {};

                        if (Array.isArray(loc)) {
                            for (const item of loc) {
                                if (typeof item === 'string') {
                                    result[item.toLowerCase()] = '0';
                                } else if (typeof item === 'object') {
                                    for (const [k, v] of Object.entries(item)) {
                                        result[k] = String(v);
                                    }
                                }
                            }
                        } else if (typeof loc === 'object') {
                            for (const [k, v] of Object.entries(loc)) {
                                result[k] = String(v);
                            }
                        } else if (typeof loc === 'string') {
                            const parts = loc.split(',').map(s => s.trim());
                            for (const p of parts) {
                                const [side, val] = p.split(':').map(s => s.trim());
                                result[side] = val || '0';
                            }
                        }

                        container[childName].location = result;
                    }

                    // === РЕКУРСИЯ: если у дочернего есть pattern_definition или pattern ===
                    if ('pattern_definition' in childProps) {

                        const inlineName = `${childName}_inline`;

                        // Выносим дочерний паттерн на верхний уровень
                        extractPatterns({ [inlineName]: childProps }, patterns);

                        // Меняем ссылку у родителя:
                        // Был childName, стал inlineName
                        container[childName].pattern = inlineName;
                    } 
                    else if (container[childName].pattern === null) {
                        
                        // Если не inline, имя паттерна = имя ключа
                        container[childName].pattern = childName;
                    }
                }
            } else if (key !== 'pattern_definition' && key !== 'item_pattern' && key !== 'location' && key !== 'pattern') {
                // Все остальные поля (style, count_in_document и тд) на верхний ровень
                patterns[name][key] = value;
            }
        }
    }

    return patterns;
}

// // === ЗАПУСК ===
// const patterns = extractPatterns(rawYaml);
// console.log("Переработанный YAML в JSON\n", patterns);

export { extractPatterns };