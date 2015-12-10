var test = require('tap').test
var run = require('./util/run')
var fixtures = require('./util/fixtures')
var map = require('./util/map')

var sources = map(
  ['a.css', 'b.css', 'c.css'].map(fixtures.one),
  [
    '@import "./b.css";\na {}',
    '@import "./c.css";\nb {}',
    'c {}',
  ]
)
test('readFile', run.bind(
  null,
  {
    resolve: function (id) {
      return Promise.resolve(fixtures(id))
    },
    readFile: function (file) {
      return Promise.resolve(sources[file])
    },
  },
  { file: 'readFile.css', source: '@import "a.css";' },
  { source: 'c {}\nb {}\na {}' }
))

