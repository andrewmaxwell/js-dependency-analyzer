const {transform} = require('babel-core');
const {nodesWhere} = require('./utils.js');
const fs = require('fs');
const Path = require('path');

const EXCLUDED_PATH_ENDINGS = /(params,\d+|property|id|key|imported|local)$/;
const LOCAL_DECLARATION_PATH_ENDINGS = /(declarations,\d+,id|params,\d+(,left)?),name$/;
const DECLARATION_PATH = /^(declaration,)?declarations,\d+,id,name$/;
const IMPORT_PATH = /source,value$/;
const builtIns = [
  'document',
  'window',
  'module',
  'require',
  'Object',
  'Function',
  'Boolean',
  'Symbol',
  'Error',
  'JSON',
  'Date',
  'undefined',
  'Infinity',
  'RegExp',
  'parseInt',
  'parseFloat',
  'NaN',
  'Math',
  'String',
  'Array',
  'Promise',
  'arguments',
  'isNaN',
  'console'
];

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
    (val, path) =>
      val && /^\.(.+)\.js$/.test(val) && IMPORT_PATH.test(path.join(',')),
    astNode
  );

const normalize = (from, to) => Path.normalize(Path.dirname(from) + '/' + to);

const getFiles = entryFileName => {
  const queue = [Path.resolve(entryFileName)];
  const result = [];

  for (let i = 0; i < queue.length; i++) {
    const fileName = queue[i];

    const code = fs.readFileSync(fileName).toString();
    const ast = transform(code, {
      babelrc: false,
      plugins: [
        'transform-react-jsx',
        'transform-object-rest-spread',
        'transform-class-properties'
      ],
      code: false
    }).ast.program.body;

    queue.push(
      ...getImportedFileNames(ast)
        .map(p => normalize(fileName, p))
        .filter(val => !queue.includes(val))
    );

    result[i] = {fileName, code, ast};
  }
  return result;
};

const withAst = false;
const toId = (fileName, id) => id + '__' + fileName;

const GetDeps = entryFileName =>
  getFiles(entryFileName).reduce((res, {fileName, code, ast}, i) => {
    const importMapping = {};

    ast.forEach(astNode => {
      const declarations = getDeclarations(astNode);
      declarations.forEach(id => {
        importMapping[id] = toId(fileName, id);
      });

      const data = {
        code: code.slice(astNode.start, astNode.end),
        dependencies: getBlockDeps(astNode).map(dep => {
          if (!importMapping[dep]) {
            console.log('No mapping found for', dep);
          }
          return importMapping[dep] || dep;
        })
      };

      if (withAst) data.astNode = astNode;

      if (astNode.type === 'ImportDeclaration') {
        const impFileName = astNode.source.value.startsWith('.')
          ? normalize(fileName, astNode.source.value)
          : astNode.source.value;

        astNode.specifiers.forEach(sp => {
          if (sp.type === 'ImportDefaultSpecifier') {
            importMapping[sp.local.name] = toId(impFileName, 'default');
          } else {
            importMapping[sp.imported.name] = toId(
              impFileName,
              sp.imported.name
            );
          }
        });
      } else if (!declarations.length) {
        res[
          toId(
            fileName,
            astNode.type === 'ExportDefaultDeclaration' ? 'default' : 'expr' + i
          )
        ] = data;
      }

      declarations.forEach(id => {
        res[toId(fileName, id)] = data;
      });
    });
    return res;
  }, {});

module.exports = {GetDeps};
