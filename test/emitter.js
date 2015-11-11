var test = require('tape')
var atImport = require('..')
var postcss = require('postcss')
var path = require('path')
var fixtures = require('./util/fixtures')

var contents = {
  d: '@import "e.css";\nd {}',
  e: '@import "f.css";\ne {}',
  f: 'f {}',
}

var entry = fixtures('emitter.css')
var expectedImports = {}
expectedImports[entry] = [
  'glob_imports/a.css', 'glob_imports/b.css', 'glob_imports/c.css',
  'd.css',
].map(fixtures.one)
expectedImports[fixtures('d.css')] = [fixtures('e.css')]
expectedImports[fixtures('e.css')] = [fixtures('f.css')]

test('emitter', function(t) {
  var postcssOpts = { from: entry }
  return postcss(atImport({
    glob: true,
    importer: function (url) {
      var base = path.basename(url, '.css')
      if (!contents[base]) {
        return
      }
      return Promise.resolve({
        from: fixtures(url),
        source: contents[base],
      })
    },
    on: {
      import: function (file, from, opts) {
        t.ok(expectedImports[from].indexOf(file) !== -1, file)
        t.same(opts.postcssOpts, postcssOpts)
      },
      imports: function (imports, from, opts) {
        t.same(imports, expectedImports[from] || [], from)
        t.same(opts.postcssOpts, postcssOpts)
      },
    },
  }))
  .process(
    '@import "./glob_imports/*.css";\n@import "d.css";',
    postcssOpts
  )
  .then(function (result) {
    t.equal(result.css, 'a {}b {}c {}\nf {}\ne {}\nd {}')
  })
  .catch(function (err) {
    t.error(err)
  })
})

