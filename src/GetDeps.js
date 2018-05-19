const {transform} = require('babel-core');
const {nodesWhere} = require('./utils.js');

const EXCLUDED_PATH_ENDINGS = /(params,\d+|property|id|key|imported|local)$/;
const DECLARATION_PATH_ENDINGS = /(declarations,\d+,id|params,\d+),name$/;
const ID_PATH = /^declarations,\d+,id,name|specifiers,\d+,imported,name/;
const builtIns = ['document', 'window', 'module', 'require', 'Object', 'JSON'];

const isDeclaredIn = (name, astNode) =>
  nodesWhere(
    (val, path) =>
      val === name && DECLARATION_PATH_ENDINGS.test(path.join(',')),
    astNode
  ).length > 0;

const getDependencies = astNode =>
  nodesWhere(
    (val, path) =>
      val &&
      val.type === 'Identifier' &&
      !builtIns.includes(val.name) &&
      !EXCLUDED_PATH_ENDINGS.test(path.join(',')),
    astNode
  )
    .map(o => o.name)
    .filter(
      (val, i, arr) => arr.indexOf(val) === i && !isDeclaredIn(val, astNode)
    )
    .sort();

const getIds = astNode =>
  nodesWhere(
    (val, path) => val && ID_PATH.test(path.join(',')),
    astNode
  ).sort();

const GetDeps = origCode => {
  const result = transform(origCode, {
    babelrc: false,
    plugins: ['transform-react-jsx', 'transform-object-rest-spread'],
    code: false
  });

  return result.ast.program.body.map(astNode => ({
    code: origCode.slice(astNode.start, astNode.end),
    dependencies: getDependencies(astNode),
    declarations: getIds(astNode),
    astNode
  }));
};

// require('fs').writeFileSync('output.txt', JSON.stringify(astNode, null, 2));

module.exports = {GetDeps};
