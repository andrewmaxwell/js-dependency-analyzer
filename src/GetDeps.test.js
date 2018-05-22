const {GetDeps} = require('./GetDeps.js');
const {expect} = require('chai');

const data = GetDeps('./testSrc/main.js');
require('fs').writeFileSync('output.json', JSON.stringify(data, null, 2));

describe('GetDeps', () => {
  it('should build a dependency graph of a project', () => {
    expect(GetDeps('./testSrc/main.js')).to.deep.equal({
      'res__/Users/amaxw/js-dependency-analyzer/testSrc/main.js': {
        code:
          "const res = GetDeps(fs.readFileSync('../ui/src/client/index.js').toString());",
        dependencies: [
          'GetDeps__/Users/amaxw/js-dependency-analyzer/testSrc/GetDeps.js',
          'default__fs'
        ]
      },
      'expr0__/Users/amaxw/js-dependency-analyzer/testSrc/main.js': {
        code: "fs.writeFileSync('output.json', JSON.stringify(res, null, 2));",
        dependencies: [
          'default__fs',
          'res__/Users/amaxw/js-dependency-analyzer/testSrc/main.js'
        ]
      },
      'EXCLUDED_PATH_ENDINGS__/Users/amaxw/js-dependency-analyzer/testSrc/GetDeps.js': {
        code:
          'const EXCLUDED_PATH_ENDINGS = /(params,\\d+|property|id|key|imported|local)$/;',
        dependencies: []
      },
      'getDependencies__/Users/amaxw/js-dependency-analyzer/testSrc/GetDeps.js': {
        code:
          "const getDependencies = astNode =>\n  nodesWhere(\n    (val, path) =>\n      val &&\n      val.type === 'Identifier' &&\n      !EXCLUDED_PATH_ENDINGS.test(path.join(',')),\n    astNode\n  )\n    .map(o => o.name)\n    .filter((val, i, arr) => arr.indexOf(val) === i)\n    .sort();",
        dependencies: [
          'EXCLUDED_PATH_ENDINGS__/Users/amaxw/js-dependency-analyzer/testSrc/GetDeps.js',
          'default__/Users/amaxw/js-dependency-analyzer/testSrc/nodesWhere.js'
        ]
      },
      'GetDeps__/Users/amaxw/js-dependency-analyzer/testSrc/GetDeps.js': {
        code:
          "export const GetDeps = origCode => {\n  const result = transform(origCode, {\n    babelrc: false,\n    plugins: ['transform-react-jsx', 'transform-object-rest-spread'],\n    code: false\n  });\n\n  return result.ast.program.body.map(astNode => ({\n    code: origCode.slice(astNode.start, astNode.end),\n    dependencies: getDependencies(astNode),\n    astNode\n  }));\n};",
        dependencies: [
          'getDependencies__/Users/amaxw/js-dependency-analyzer/testSrc/GetDeps.js',
          'transform__babel-core'
        ]
      },
      'nodesWhere__/Users/amaxw/js-dependency-analyzer/testSrc/nodesWhere.js': {
        code:
          "export const nodesWhere = (cond, node, path = []) =>\n  Object.keys(node && typeof node === 'object' ? node : []).reduce(\n    (res, key) => res.concat(nodesWhere(cond, node[key], path.concat(key))),\n    cond(node, path) ? [node] : []\n  );",
        dependencies: []
      },
      'default__/Users/amaxw/js-dependency-analyzer/testSrc/nodesWhere.js': {
        code: 'export default nodesWhere;',
        dependencies: [
          'nodesWhere__/Users/amaxw/js-dependency-analyzer/testSrc/nodesWhere.js'
        ]
      }
    });
  });
});
