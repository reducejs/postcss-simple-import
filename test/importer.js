var test = require('tap').test
var run = require('./util/run')
var fixtures = require('./util/fixtures')
var path = require('path')

var contents = {
  a: '@import "b.css";\na {}',
  b: '@import "c.css";\nb {}',
  c: 'c {}',
}
test('importer, `from` and `source`', run.bind(
  null,
  {
    importer: function (url) {
      return Promise.resolve({
        from: fixtures(url),
        source: contents[path.basename(url, '.css')],
      })
    },
  },
  { file: 'importer.css', source: '@import "a.css";' },
  { source: 'c {}\nb {}\na {}' }
))

test('importer, `from`', run.bind(
  null,
  {
    importer: function (url) {
      return Promise.resolve({
        from: fixtures(url),
      })
    },
    readFile: function (file) {
      return Promise.resolve(
        contents[path.basename(file, '.css')]
      )
    },
  },
  { file: 'importer.css', source: '@import "a.css";' },
  { source: 'c {}\nb {}\na {}' }
))

