var test = require('tape')
var run = require('./util/run')
var fixtures = require('./util/fixtures')
var Map = require('./util/map')

var source = Map(
  ['a.css', 'b.css', 'c.css'].map(fixtures.one),
  [
    '@require "./b.css";\na {}',
    '@require "./c.css";\nb {}',
    'c {}',
  ]
)

test('atRule', run.bind(
  null,
  {
    atRule: 'require',
    resolve: function (id) {
      return Promise.resolve(fixtures(id))
    },
    readFile: function (file) {
      return Promise.resolve(source[file])
    },
  },
  { file: 'atRule.css', source: '@require "a.css";' },
  { source: 'c {}\nb {}\na {}' }
))

