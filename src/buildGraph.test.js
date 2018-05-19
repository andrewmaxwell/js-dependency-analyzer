const {buildGraph} = require('./buildGraph.js');
const {expect} = require('chai');

describe('buildGraph', () => {
  it('should build a dependency graph of a project', () => {
    expect(buildGraph('../testSrc/main.js')).to.deep.equal({
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
