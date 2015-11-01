var path = require('path')
var atImport = require('../..')
var postcss = require('postcss')
var fs = require('fs')
var fixtures = require('./fixtures')

module.exports = function (opts, src, expected, t) {
  var srcFile = fixtures(getFile(src))
  var body = getContents(src)
  body = body === null ? fs.readFileSync(srcFile, 'utf8') : body
  return postcss(atImport(opts || {}))
    .process(body, { from: srcFile })
    .then(function (result) {
      var expectedBody = getContents(expected)
      if (expectedBody === null) {
        var expectedFile = getFile(expected)
        expectedFile = expectedFile && fixtures(expectedFile) || path.join(
          path.dirname(srcFile),
          path.basename(srcFile, '.css') + '.expected.css'
        )
        expectedBody = fs.readFileSync(expectedFile, 'utf8')
      }
      t.equal(result.css.trim(), expectedBody.trim())
    })
}

function getFile(o) {
  if (typeof o === 'string') {
    return o
  }
  return o && o.file
}

function getContents(o) {
  if (o && typeof o === 'object') {
    return o.source
  }
  return null
}


