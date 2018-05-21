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
      GetDeps_EXCLUDED_PATH_ENDINGS: {
        code:
          'const EXCLUDED_PATH_ENDINGS = /(params,\\d+|property|id|key|imported|local)$/;',
        dependencies: []
      },
      utils_nodesWhere: {
        code: `const nodesWhere = (cond, node, path = []) =>
          Object.keys(node && typeof node === 'object' ? node : []).reduce(
            (res, key) => res.concat(nodesWhere(cond, node[key], path.concat(key))),
            cond(node, path) ? [node] : []
          );`,
        dependencies: []
      },
      GetDeps_getDependencies: {
        code: `const getDependencies = astNode =>
          nodesWhere(
            (val, path) =>
              val &&
              val.type === 'Identifier' &&
              !EXCLUDED_PATH_ENDINGS.test(path.join(',')),
            astNode
          )
            .map(o => o.name)
            .filter(
              (val, i, arr) => arr.indexOf(val) === i
            )
            .sort();`,
        dependencies: ['utils_nodesWhere', 'GetDeps_EXCLUDED_PATH_ENDINGS']
      },
      GetDeps_GetDeps: {
        code: `const GetDeps = origCode => {
          const result = transform(origCode, {
            babelrc: false,
            plugins: ['transform-react-jsx', 'transform-object-rest-spread'],
            code: false
          });

          return result.ast.program.body.map(astNode => ({
            code: origCode.slice(astNode.start, astNode.end),
            dependencies: getDependencies(astNode),
            astNode
          }));
        };`,
        dependencies: ['babel-core_transform', 'GetDeps_getDependencies']
      },
      main_res: {
        code:
          "const res = GetDeps(fs.readFileSync('../ui/src/client/index.js').toString());",
        dependencies: ['GetDeps_GetDeps', 'fs']
      },
      main_anonymous1: {
        code: "fs.writeFileSync('output.txt', JSON.stringify(res, null, 2));",
        dependencies: ['fs', 'main_res']
      }
    });
  });
});
