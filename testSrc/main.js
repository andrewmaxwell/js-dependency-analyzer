const {GetDeps} = require('./GetDeps.js');
const fs = require('fs');

const res = GetDeps(fs.readFileSync('../ui/src/client/index.js').toString());
fs.writeFileSync('output.txt', JSON.stringify(res, null, 2));
