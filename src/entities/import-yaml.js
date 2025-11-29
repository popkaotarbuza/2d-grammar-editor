
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

        // === Обработка extends ===
        if ('extends' in properties) {
            const ext = properties.extends;
            if (Array.isArray(ext)) {
                patterns[name].extends = ext.slice(); // копия массива
            } else if (typeof ext === 'string') {
                patterns[name].extends = [ext]; // одна строка → массив из одного элемента
            } else if (typeof ext === 'object' && ext !== null) {
                // объект с индексами → преобразуем в массив по ключам 0,1,2…
                patterns[name].extends = Object.keys(ext)
                    .sort((a,b) => a - b)
                    .map(k => ext[k]);
            } else {
                // всё остальное → пустой массив
                patterns[name].extends = [];
            }
        } else {
            patterns[name].extends = [];
        }


    }

    return patterns;
}





/**
 * cleanEmptyPatternComponents
 * --------------------------------------
 * Рекурсивно очищает объект YAML-паттернов от пустых компонентов:
 *
 * - Пропускает ключи со значением:
 *   • null
 *   • пустая строка ""
 *   • undefined
 *
 * - Если значение — объект:
 *     рекурсивно обрабатывает вложенность
 *     если объект пуст после очистки → удаляет его
 * 
 * @param {Object} obj — исходный YAML-объект
 * @returns {Object|null} — очищенный объект или null, если он пуст
 */
export function cleanEmptyPatternComponents(obj) {

    // Если obj → не объект (например, строка, число, null) → выкидываем
    if (!obj || typeof obj !== 'object') return null;

    const cleaned = {};

    for (const [key, value] of Object.entries(obj)) {
        
        // Удаляем пустые элементы
        if (value === null || value === '' || value === undefined) {
            continue;
        }

        // Если вложенный объект — продолжаем рекурсию
        if (typeof value === 'object') {
            const cleanedChild = cleanEmptyPatternComponents(value);

            // Если объект после очистки всё ещё содержательный → оставляем
            if (cleanedChild !== null && Object.keys(cleanedChild).length > 0) {
                cleaned[key] = cleanedChild;
            }

        } else {
            // Примитивы оставляем как есть
            cleaned[key] = value;
        }
    }

    // Если весь объект пуст — возвращаем null (чтобы уровни без данных исчезали)
    return Object.keys(cleaned).length > 0 ? cleaned : null;
}


export { extractPatterns };