import {GetDeps} from './GetDeps.js';
import fs from 'fs';

const res = GetDeps(fs.readFileSync('../ui/src/client/index.js').toString());
fs.writeFileSync('output.json', JSON.stringify(res, null, 2));
