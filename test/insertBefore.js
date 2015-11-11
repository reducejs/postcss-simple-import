var test = require('tape')
var atImport = require('..')
var postcss = require('postcss')
var path = require('path')
var fixtures = require('./util/fixtures')

var contents = {
  d: '@import "e.css";\nie7 { *display: inline; }',
  e: '@import "f.css";\nie8 { display: inline\\0; }',
  f: '@import "g.css";\nie89 { display: inline\\0/IE8+9; }',
  g: 'ie9 { display: inline\\0/IE9; }',
}

var entry = fixtures('emitter.css')

test('insertBefore', function(t) {
  var postcssOpts = { from: entry }
  return postcss(atImport({
    importer: function (url) {
      var base = path.basename(url, '.css')
      return Promise.resolve({
        from: fixtures(url),
        source: contents[base],
      })
    },
  }))
  .process(
    '@import "d.css";\nie6{ _display: inline; }',
    postcssOpts
  )
  .then(function (result) {
    var fs = require('fs')
    fs.writeFileSync('x.css', result.css)
    t.equal(result.css, 'ie9 { display: inline\\0/IE9; }\nie89 { display: inline\\0/IE8+9; }\nie8 { display: inline\\0; }\nie7 { *display: inline; }\nie6{ _display: inline; }')
  })
  .catch(function (err) {
    t.error(err)
  })
})

