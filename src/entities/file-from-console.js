// необязательный файл, сделанный для считывания с консоли только названия файла YAML
import * as readline from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import { readFileSync } from 'fs';

const rl = readline.createInterface({ input: stdin, output: stdout });
const fileName = await rl.question('Введите название файла: ');

const pathToFile = '../../data/to-import/';
const yamlContent = readFileSync(pathToFile + fileName + '.yaml', 'utf8');

export { yamlContent, fileName };