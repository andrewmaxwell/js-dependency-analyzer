const {GetDeps} = require('./GetDeps.js');
const {expect} = require('chai');

const tests = [
  {
    code: `(async () => {
    const history = createHistory();
    await InstallNavbar();
    Init(CoreReducer);
    Subscribe(state => {
      ReactDOM.render(
        <Router history={history}>
          <Routes {...state} />
        </Router>,
        document.getElementById('app')
      );
    });

    Startup(await GetVelocityUser(), history);
  })();`,
    deps: [
      'CoreReducer',
      'GetVelocityUser',
      'Init',
      'InstallNavbar',
      'React',
      'ReactDOM',
      'Router',
      'Routes',
      'Startup',
      'Subscribe',
      'createHistory'
    ],
    decs: []
  },
  {
    code: `const GetDeps = origCode => {
      const result = transform(origCode, {
        babelrc: false,
        plugins: ['transform-react-jsx'],
        code: false
      });

      return result.ast.program.body.map(astNode => {
        if (astNode.type === 'ImportDeclaration') return;
        const code = origCode.slice(astNode.start, astNode.end);
        return {
          code,
          astNode,
          dependencies: nodesWhere(
            (val, path) =>
              // /(object|callee|arguments,\\d+|right|left),name$/.test(path.join(',')),
              val &&
              val.type === 'Identifier' &&
              !builtIns.includes(val.name) &&
              !/(params,\\d+|property|id)$/.test(path.join(',')),
            astNode
          )
            .map(o => o.name)
            .filter((val, i, arr) => arr.indexOf(val) === i)
            .filter(val => !isDeclaredIn(val, astNode))
        };
      });
    };`,
    deps: ['builtIns', 'isDeclaredIn', 'nodesWhere', 'transform'],
    decs: ['GetDeps']
  },
  {
    code: `const abc = ['things', true, stuff, {a: 4, b: things, fun}]`,
    deps: ['fun', 'stuff', 'things'],
    decs: ['abc']
  },
  {
    code: `import {pluck, map, pipe} from 'ramda';`,
    deps: [],
    decs: ['map', 'pipe', 'pluck']
  },
  {
    code: `const things = stuff ? otherStuff : moreOtherStuff`,
    deps: ['moreOtherStuff', 'otherStuff', 'stuff'],
    decs: ['things']
  }
];

// const data = tests.map(t => GetDeps(t.code)[0]);
// require('fs').writeFileSync('output.txt', JSON.stringify(data, null, 2));

describe('GetDeps', () => {
  tests.forEach(({code, deps, decs}) => {
    it('should list the dependencies', () => {
      const {dependencies, declarations} = GetDeps(code)[0];
      expect({dependencies, declarations}).to.deep.equal({
        dependencies: deps,
        declarations: decs
      });
    });
  });
});
