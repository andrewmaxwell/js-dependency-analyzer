const {transform} = require('babel-core');
const {nodesWhere} = require('./utils.js');

const EXCLUDED_PATH_ENDINGS = /(params,\d+|property|id|key|imported|local)$/;

const getDependencies = astNode =>
  nodesWhere(
    (val, path) =>
      val &&
      val.type === 'Identifier' &&
      !EXCLUDED_PATH_ENDINGS.test(path.join(',')),
    astNode
  )
    .map(o => o.name)
    .filter((val, i, arr) => arr.indexOf(val) === i)
    .sort();

const GetDeps = origCode => {
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
};

// require('fs').writeFileSync('output.txt', JSON.stringify(astNode, null, 2));

module.exports = {GetDeps};
