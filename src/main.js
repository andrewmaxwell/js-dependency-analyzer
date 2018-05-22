/*

Optimizing dep tree

- Import costs 1, but importing more than one thing from an imported file costs 1/2 unit
- Each line after 300 costs 0.1
- Every node beyond depth Y costs X
- Cycles are equal to the largest non-cycle cost

*/

const {GetDeps} = require('./GetDeps.js');
const fs = require('fs');

// const res = GetDeps('./testSrc/main.js');
const res = GetDeps('../ui/src/client/index.js');
fs.writeFileSync('output.json', JSON.stringify(res, null, 2));
