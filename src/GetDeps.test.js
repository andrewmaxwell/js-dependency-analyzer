const {GetDeps} = require('./GetDeps.js');
const {expect} = require('chai');
const Path = require('path');

// describe('GetDeps', () => {
//   const tests = [
//     {
//       code: `(async () => {
//       const history = createHistory();
//       await InstallNavbar();
//       Init(CoreReducer);
//       Subscribe(state => {
//         ReactDOM.render(
//           <Router history={history}>
//             <Routes {...state} />
//           </Router>,
//           document.getElementById('app')
//         );
//       });
//
//       Startup(await GetVelocityUser(), history);
//     })();`,
//       deps: [
//         'CoreReducer',
//         'GetVelocityUser',
//         'Init',
//         'InstallNavbar',
//         'React',
//         'ReactDOM',
//         'Router',
//         'Routes',
//         'Startup',
//         'Subscribe',
//         'createHistory'
//       ],
//       decs: []
//     },
//     {
//       code: `const GetDeps = origCode => {
//         const result = transform(origCode, {
//           babelrc: false,
//           plugins: ['transform-react-jsx'],
//           code: false
//         });
//
//         return result.ast.program.body.map(astNode => {
//           if (astNode.type === 'ImportDeclaration') return;
//           const code = origCode.slice(astNode.start, astNode.end);
//           return {
//             code,
//             astNode,
//             dependencies: nodesWhere(
//               (val, path) =>
//                 // /(object|callee|arguments,\\d+|right|left),name$/.test(path.join(',')),
//                 val &&
//                 val.type === 'Identifier' &&
//                 !builtIns.includes(val.name) &&
//                 !/(params,\\d+|property|id)$/.test(path.join(',')),
//               astNode
//             )
//               .map(o => o.name)
//               .filter((val, i, arr) => arr.indexOf(val) === i)
//               .filter(val => !isDeclaredIn(val, astNode))
//           };
//         });
//       };`,
//       deps: ['builtIns', 'isDeclaredIn', 'nodesWhere', 'transform'],
//       decs: ['GetDeps']
//     },
//     {
//       code: `const abc = ['things', true, stuff, {a: 4, b: things, fun}]`,
//       deps: ['fun', 'stuff', 'things'],
//       decs: ['abc']
//     },
//     {
//       code: `import {pluck, map, pipe} from 'ramda';`,
//       deps: [],
//       decs: ['map', 'pipe', 'pluck']
//     },
//     {
//       code: `const things = stuff ? otherStuff : moreOtherStuff`,
//       deps: ['moreOtherStuff', 'otherStuff', 'stuff'],
//       decs: ['things']
//     }
//   ];
//   tests.forEach(({code, deps, decs}) => {
//     it('should list the dependencies', () => {
//       const {dependencies, declarations} = GetDeps(code)[0];
//       expect({dependencies, declarations}).to.deep.equal({
//         dependencies: deps,
//         declarations: decs
//       });
//     });
//   });
// });

const data = GetDeps('./testSrc/main.js');
require('fs').writeFileSync('output.txt', JSON.stringify(data, null, 2));

describe('GetDeps', () => {
  it('should build a dependency graph of a project', () => {
    expect(GetDeps('./testSrc/main.js')).to.deep.equal({
      main_res: {
        code:
          "const res = GetDeps(fs.readFileSync('../ui/src/client/index.js').toString());",
        dependencies: ['GetDeps_GetDeps', 'fs']
      },
      main_0: {
        code: "fs.writeFileSync('output.txt', JSON.stringify(res, null, 2));",
        dependencies: ['fs', 'main_res']
      },
      GetDeps_EXCLUDED_PATH_ENDINGS: {
        code:
          'const EXCLUDED_PATH_ENDINGS = /(params,\\d+|property|id|key|imported|local)$/;',
        dependencies: []
      },
      GetDeps_getDependencies: {
        code:
          "const getDependencies = astNode =>\n  nodesWhere(\n    (val, path) =>\n      val &&\n      val.type === 'Identifier' &&\n      !EXCLUDED_PATH_ENDINGS.test(path.join(',')),\n    astNode\n  )\n    .map(o => o.name)\n    .filter((val, i, arr) => arr.indexOf(val) === i)\n    .sort();",
        dependencies: ['GetDeps_EXCLUDED_PATH_ENDINGS', 'utils_nodesWhere']
      },
      GetDeps_GetDeps: {
        code:
          "export const GetDeps = origCode => {\n  const result = transform(origCode, {\n    babelrc: false,\n    plugins: ['transform-react-jsx', 'transform-object-rest-spread'],\n    code: false\n  });\n\n  return result.ast.program.body.map(astNode => ({\n    code: origCode.slice(astNode.start, astNode.end),\n    dependencies: getDependencies(astNode),\n    astNode\n  }));\n};",
        dependencies: ['GetDeps_getDependencies', 'babel-core_transform']
      },
      utils_nodesWhere: {
        code:
          "export const nodesWhere = (cond, node, path = []) =>\n  Object.keys(node && typeof node === 'object' ? node : []).reduce(\n    (res, key) => res.concat(nodesWhere(cond, node[key], path.concat(key))),\n    cond(node, path) ? [node] : []\n  );",
        dependencies: ['path']
      }
    });
  });
});
