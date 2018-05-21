const {transform} = require('babel-core');
const {nodesWhere} = require('./utils.js');
const fs = require('fs');
const Path = require('path');

const EXCLUDED_PATH_ENDINGS = /(params,\d+|property|id|key|imported|local)$/;
const LOCAL_DECLARATION_PATH_ENDINGS = /(declarations,\d+,id|params,\d+),name$/;
const DECLARATION_PATH = /^(declaration,)?declarations,\d+,id,name$/;
const IMPORT_PATH = /source,value$/;
const builtIns = ['document', 'window', 'module', 'require', 'Object', 'JSON'];

const isDeclaredIn = (name, astNode) =>
  nodesWhere(
    (val, path) =>
      val === name && LOCAL_DECLARATION_PATH_ENDINGS.test(path.join(',')),
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

const getDeclarations = astNode =>
  nodesWhere(
    (val, path) => val && DECLARATION_PATH.test(path.join(',')),
    astNode
  ).sort();

const getImportedFileNames = astNode =>
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
//     declarations: getDeclarations(astNode),
//     astNode
//   }));
// };

const fileNameToId = fileName =>
  fileName
    .replace('/Users/amaxw/js-dependency-analyzer/testSrc/', '') // todo
    .replace('.js', '')
    .replace(/[^a-zA-Z0-9]+/g, '-');

const normalize = (from, to) => Path.normalize(Path.dirname(from) + '/' + to);

const GetDeps = entryFileName => {
  const queue = [Path.resolve(entryFileName)];
  const res = {};
  let counter = 0;

  for (let i = 0; i < queue.length; i++) {
    const fileName = queue[i];

    const code = fs.readFileSync(fileName).toString();
    const ast = transform(code, {
      babelrc: false,
      plugins: ['transform-react-jsx', 'transform-object-rest-spread'],
      code: false
    }).ast.program.body;

    queue.push(
      ...getImportedFileNames(ast)
        .map(p => normalize(fileName, p))
        .filter(val => !queue.includes(val))
    );

    const fileId = fileNameToId(fileName);

    const importMapping = {};

    ast.forEach(astNode => {
      const declarations = getDeclarations(astNode);
      declarations.forEach(id => {
        importMapping[id] = fileId + '_' + id;
      });

      const func = {
        code: code.slice(astNode.start, astNode.end),
        dependencies: getBlockDeps(astNode).map(dep => {
          if (!importMapping[dep]) {
            console.log('No mapping found for', dep);
          }
          return importMapping[dep] || dep;
        })
        // astNode
      };

      if (astNode.type === 'ImportDeclaration') {
        const impFileId = fileNameToId(
          normalize(fileName, astNode.source.value)
        );
        astNode.specifiers.forEach(sp => {
          if (sp.imported) {
            importMapping[sp.imported.name] =
              impFileId + '_' + sp.imported.name;
          }
        });
      } else if (!declarations.length) {
        res[fileId + '_' + counter++] = func;
      }

      declarations.forEach(id => {
        res[fileId + '_' + id] = func;
      });
    });
  }
  return res;
};

module.exports = {GetDeps};
