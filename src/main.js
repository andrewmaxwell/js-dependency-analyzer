/*

Optimizing dep tree

- Import costs 1, but importing more than one thing from an imported file costs 1/2 unit
- Each line after 300 costs 0.1
- Every node beyond depth Y costs X
- Cycles are equal to the largest non-cycle cost

*/

import {GetDeps} from './GetDeps.js';
import fs from 'fs';

// const res = GetDeps('./src/main.js');
const res = GetDeps(['../ui/src/client/index.js', '../ui/src/server/App.js']);
fs.writeFileSync(
  'output.json',
  JSON.stringify(res, null, 2).replace(/\/Users\/amaxw\/ui\/src\//g, '')
);

const keys = Object.keys(res);
// fs.writeFileSync(
//   'output.json',
//   keys
//     .reduce(
//       (d, key) =>
//         d.concat(
//           res[key].dependencies
//             .filter(p => res[p.id])
//             .map(p => key + ' ' + p.id)
//         ),
//       []
//     )
//     .filter((el, i, arr) => arr.indexOf(el) === i)
//     .join('\n')
//     .replace(/\/Users\/amaxw\/ui\/src\/(client\/)?|\.js/g, '')
// );
console.log(keys.length + ' nodes');
console.log(
  keys.reduce((sum, key) => sum + res[key].dependencies.length, 0) + ' edges'
);
