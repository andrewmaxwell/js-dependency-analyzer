const {transform} = require('babel-core');

const nodesWhere = (cond, node, path = []) =>
  Object.keys(node && typeof node === 'object' ? node : []).reduce(
    (res, key) => res.concat(nodesWhere(cond, node[key], path.concat(key))),
    cond(node, path) ? [node] : []
  );

const EXCLUDED_PATH_ENDINGS = /(params,\d+|property|id|key|imported|local)$/;
const DECLARATION_PATH_ENDINGS = /(declarations,\d+,id|params,\d+),name$/;
const builtIns = ['document', 'window', 'exports', 'require'];

const isDeclaredIn = (exports.isDeclaredIn = (name, astNode) =>
  nodesWhere(
    (val, path) =>
      val === name && DECLARATION_PATH_ENDINGS.test(path.join(',')),
    astNode
  ).length > 0);

exports.GetDeps = origCode => {
  const result = transform(origCode, {
    babelrc: false,
    plugins: ['transform-react-jsx', 'transform-object-rest-spread'],
    code: false
  });

  return result.ast.program.body.map(astNode => {
    const code = origCode.slice(astNode.start, astNode.end);
    // require('fs').writeFileSync('output.txt', JSON.stringify(astNode, null, 2));
    return {
      code,
      dependencies: nodesWhere(
        (val, path) =>
          val &&
          val.type === 'Identifier' &&
          !builtIns.includes(val.name) &&
          !EXCLUDED_PATH_ENDINGS.test(path.join(',')),
        astNode
      )
        .map(o => o.name)
        .filter((val, i, arr) => arr.indexOf(val) === i)
        .filter(val => !isDeclaredIn(val, astNode)),
      astNode
    };
  });
};
