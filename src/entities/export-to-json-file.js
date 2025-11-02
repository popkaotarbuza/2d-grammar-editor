// необязательный файл, нужен только для экспорта паттернов в JSON файл

import { writeFileSync } from "fs";
import { patterns, fileName } from "./import-yaml.js";

const pathToFile = '../../data/exported/';
const fileToExport = pathToFile + fileName + '.json';

writeFileSync(fileToExport, JSON.stringify(patterns, null, 2), 'utf8');
console.log('Паттерны сохранены в ' + fileToExport);