// импорт данных из YAML файлов
import { parse } from 'yaml';

import { yamlContent, fileName } from './file-from-console.js';

const rawYaml = parse(yamlContent);
console.log("Исходный YAML\n", rawYaml);

// Функция для извлечения паттернов из YAML данных
function extractPatterns(yamlData, patterns = {}) {
    if ('patterns' in yamlData) {
        yamlData = yamlData.patterns; // берём только содержимое
    }
    for (const [name, properties] of Object.entries(yamlData)) {
        if (!properties || typeof properties !== 'object' || Array.isArray(properties)) continue;

        // Создаём паттерн с 4 обязательными полями
        patterns[name] = {
        pattern_definition: {},
        location: null,
        inner: null,
        outer: null
        };

        let currentObj = properties;
        let currentKey = null;

        // Если pattern_definition прямо в properties
        if ('pattern_definition' in properties) {
        patterns[name].pattern_definition = { ...properties.pattern_definition };
        delete properties.pattern_definition;
        currentObj = properties;
        }

        // Обходим свойства: ищем inner, outer, location
        for (const [key, value] of Object.entries(properties)) {
            if (key === 'inner' || key === 'outer') {
                // Рекурсивно обрабатываем дочерний паттерн
                const childName = Object.keys(value)[0]; // например, "groups"
                const childProps = value[childName];

                // Рекурсия: создаём дочерний паттерн
                extractPatterns({ [childName]: childProps }, patterns);

                // Ссылка: inner: "groups" или outer: "groups"
                patterns[name][key] = childName;

                // Если в дочернем есть location — переносим в родителя? Нет, оставляем в дочернем.
                // Но если location в родителе — он остаётся.
            } else if (key === 'location') {
                // location → всегда строка
                if (Array.isArray(value)) {
                patterns[name].location = value.join(', ');
                } else if (typeof value === 'string') {
                patterns[name].location = value;
                }
            } else {
                // Все остальные поля (size, style, count_in_document) → в pattern_definition
                patterns[name].pattern_definition[key] = value;
            }
        }
    }

    return patterns;
}

// === ЗАПУСК ===
const patterns = extractPatterns(rawYaml);
console.log("Переработанный YAML в JSON\n", patterns);

export { patterns, fileName };