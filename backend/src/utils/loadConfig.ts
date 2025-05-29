// src/config.ts
import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';


const cfgPath = path.resolve(__dirname, '..', '..', 'config.yaml');
const file = fs.readFileSync(cfgPath, 'utf8');
export const config = yaml.load(file) as any