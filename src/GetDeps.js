const {transform} = require('babel-core');
const {nodesWhere, deepWithout} = require('./utils.js');
const fs = require('fs');
const Path = require('path');

const EXCLUDED_PATH_ENDINGS = /(params,\d+|property|id|key|imported|local)$/;
const LOCAL_DECLARATION_PATH_ENDINGS = new RegExp(
  `
  (
    (
      (declarations,\\d+,id)
      (
        (,properties,\\d+,value)
        |
        (,elements,\\d+)
      )*
      (,argument)?
    ) | (
      (params,\\d+)
      (
        (,argument)
        |
        ((,left)?,properties,\\d+,value)+
      )?
    ) | (handler,param)
  )
  (,left)?
  ,name$`.replace(/\s/g, '')
);
const DECLARATION_PATH = /^(declaration,)?declarations,\d+,id,name$/;
const IMPORT_PATH = /source,value$/;
const builtIns = [
  'Array',
  'Boolean',
  'Date',
  'Error',
  'File',
  'FileReader',
  'FormData',
  'Function',
  'Infinity',
  'JSON',
  'Math',
  'NaN',
  'Number',
  'Object',
  'Promise',
  'RegExp',
  'Response',
  'Set',
  'String',
  'Symbol',
  '_extends',
  'arguments',
  'clearInterval',
  'clearTimeout',
  'console',
  'document',
  'encodeURIComponent',
  'fetch',
  'isNaN',
  'module',
  'parseFloat',
  'parseInt',
  'require',
  'setInterval',
  'setTimeout',
  'undefined',
  'window'
].reduce((res, el) => ({...res, [el]: true}), {});

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
      !builtIns[val.name] &&
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
const toId = (fileName, imported) => imported + ':' + fileName;

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
            console.log(
              JSON.stringify(deepWithout(['loc'], astNode), null, 2),
              code.slice(astNode.start, astNode.end),
              'No mapping found for',
              dep
            );
            throw 'error';
          }
          return {id: importMapping[dep], as: dep};
        })
      };

      if (withAst) data.astNode = astNode;

      if (astNode.type === 'ImportDeclaration') {
        const impFileName = astNode.source.value.startsWith('.')
          ? normalize(fileName, astNode.source.value)
          : astNode.source.value;

        // console.log(data.code, JSON.stringify(astNode, null, 2));
        astNode.specifiers.forEach(sp => {
          importMapping[sp.local ? sp.local.name : sp.imported.name] = toId(
            impFileName,
            sp.imported ? sp.imported.name : 'default'
          );
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
