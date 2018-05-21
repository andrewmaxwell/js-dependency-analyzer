const {transform} = require('babel-core');
const {nodesWhere} = require('./utils.js');
const fs = require('fs');
const Path = require('path');

const EXCLUDED_PATH_ENDINGS = /(params,\d+|property|id|key|imported|local)$/;
const DECLARATION_PATH_ENDINGS = /(declarations,\d+,id|params,\d+),name$/;
const ID_PATH = /^(declaration,)?declarations,\d+,id,name$/;
const IMPORT_PATH = /source,value$/;
const builtIns = ['document', 'window', 'module', 'require', 'Object', 'JSON'];

const isDeclaredIn = (name, astNode) =>
  nodesWhere(
    (val, path) =>
      val === name && DECLARATION_PATH_ENDINGS.test(path.join(',')),
    astNode
  ).length > 0;

const getBlockDeps = astNode =>
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

const getImports = astNode =>
  nodesWhere(
    (val, path) => val && val[0] === '.' && IMPORT_PATH.test(path.join(',')),
    astNode
  );

// const GetDeps = origCode => {
//   const result = transform(origCode, {
//     babelrc: false,
//     plugins: ['transform-react-jsx', 'transform-object-rest-spread'],
//     code: false
//   });
//
//   return result.ast.program.body.map(astNode => ({
//     code: origCode.slice(astNode.start, astNode.end),
//     dependencies: getBlockDeps(astNode),
//     declarations: getIds(astNode),
//     astNode
//   }));
// };

const GetDeps = entryFileName => {
  const queue = [Path.resolve(entryFileName)];
  const files = [];
  const res = {};
  let counter = 1;

  for (let i = 0; i < queue.length; i++) {
    const fileName = queue[i];

    const code = fs.readFileSync(fileName).toString();
    const ast = transform(code, {
      babelrc: false,
      plugins: ['transform-react-jsx', 'transform-object-rest-spread'],
      code: false
    }).ast.program.body;

    queue.push(
      ...getImports(ast)
        .map(p => Path.normalize(Path.dirname(fileName) + '/' + p))
        .filter(val => !queue.includes(val))
    );

    const fileId = fileName
      .replace('/Users/amaxw/js-dependency-analyzer/testSrc/', '') // todo
      .replace('.js', '')
      .replace(/[^a-zA-Z0-9]+/g, '_');
    files[i] = {fileId, ast};

    ast.forEach(astNode => {
      const func = {
        code: code.slice(astNode.start, astNode.end),
        dependencies: getBlockDeps(astNode) //.map(dep => {
        // todo: if declared in file, prefix with fileId, else use id of imported file
        // })
        // astNode
      };
      const ids = getIds(astNode);
      if (!ids.length && astNode.type !== 'ImportDeclaration') {
        res[fileId + '_anon' + counter++] = func;
      }
      ids.forEach(id => {
        res[fileId + '_' + id] = func;
      });
    });
  }
  // fileName = Path.resolve(fileName);
  // const code = fs.readFileSync(fileName).toString();
  // const result = transform(code, {
  //   babelrc: false,
  //   plugins: ['transform-react-jsx', 'transform-object-rest-spread'],
  //   code: false
  // });
  //
  // return result.ast.program.body.reduce((res, astNode) => {
  //   if (astNode.type === 'ImportDeclaration') {
  //     const imFileName = getImports(astNode)[0];
  //     if (imFileName[0] === '.') {
  //       // const abs = Path.normalize(Path.dirname(fileName) + '/' + imFileName);
  //       // console.log('abs', abs);
  //       // Object.assign(res, GetDeps(abs));
  //     }
  //   } else {
  //     const func = {
  //       code: code.slice(astNode.start, astNode.end),
  //       dependencies: getBlockDeps(astNode)
  //       // astNode
  //     };
  //     getIds(astNode).forEach(id => {
  //       res[id] = func;
  //     });
  //   }
  //
  //   return res;
  // }, {});

  return res;
};

module.exports = {GetDeps};
