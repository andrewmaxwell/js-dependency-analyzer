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
    res: [
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
    ]
  },
  {
    code: `exports.GetDeps = origCode => {
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
    res: ['builtIns', 'isDeclaredIn', 'nodesWhere', 'transform']
  },
  {
    code: `const abc = ['things', true, stuff, {a: 4, b: things, fun}]`,
    res: ['fun', 'stuff', 'things']
  },
  {
    code: `import {pluck, map, pipe} from 'ramda';`,
    res: []
  },
  {
    code: `const things = stuff ? otherStuff : moreOtherStuff`,
    res: ['moreOtherStuff', 'otherStuff', 'stuff']
  }
];

describe('GetDeps', () => {
  tests.forEach(({code, res}) => {
    it('should list the dependencies', () => {
      const {dependencies} = GetDeps(code)[0];
      expect(dependencies.sort()).to.deep.equal(res.sort());
    });
  });
});
