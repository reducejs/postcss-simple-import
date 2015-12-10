var test = require('tap').test
var run = require('./util/run')
var fixtures = require('./util/fixtures')
var map = require('./util/map')

var expectedImports = map(
  ['a.css', 'b.css', 'c.css', 'onImport.css'].map(fixtures.one),
  [
    [fixtures('b.css')],
    [fixtures('c.css')],
    [],
    [fixtures('a.css')],
  ]
)

test('onImport', function(t) {
  return run(
    {
      onImport: function (from, imports) {
        t.same(imports, expectedImports[from], from)
      },
      resolve: function (id) {
        return Promise.resolve(fixtures(id))
      },
      cache: map(
        ['a.css', 'b.css', 'c.css'].map(fixtures.one),
        [
          '@import "./b.css";\na {}',
          '@import "./c.css";\nb {}',
          'c {}',
        ]
      ),
    },
    { file: 'onImport.css', source: '@import "a.css";' },
    { source: 'c {}\nb {}\na {}' },
    t
  )
})

