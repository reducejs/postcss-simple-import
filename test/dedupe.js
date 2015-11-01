var test = require('tape')
var run = require('./util/run')
var fixtures = require('./util/fixtures')
var map = require('./util/map')

test('dedupe', run.bind(
  null,
  {
    resolve: function (id) {
      return Promise.resolve(fixtures(id))
    },
    cache: map(
      ['a.css', 'b.css', 'c.css'].map(fixtures.one),
      [
        '@import "./b.css";\n@import "./c.css";\na {}',
        '@import "./c.css";\n@import "./c.css";\nb {}',
        'c {}',
      ]
    ),
  },
  { file: 'dedupe.css', source: '@import "a.css";' },
  { source: 'c {}\nb {}\na {}' }
))

