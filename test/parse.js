var test = require('tap').test
var run = require('./util/run')
var postcss = require('postcss')
var fixtures = require('./util/fixtures')
var map = require('./util/map')

test('parse', run.bind(
  null,
  {
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
    parse: function (source, from) {
      return Promise.resolve(postcss.parse(source, { from: from }))
        .then(function (root) {
          if (from === fixtures('a.css')) {
            root.append(postcss.comment({ text: 'parse' }))
          }
          return root
        })
    },
  },
  { file: 'parse.css', source: '@import "a.css";' },
  { source: 'c {}\nb {}\na {}\n/* parse */' }
))

