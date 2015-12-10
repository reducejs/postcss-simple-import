var test = require('tap').test
var run = require('./util/run')

test('resolve', run.bind(
  null,
  null,
  'resolve.css',
  null
))

test('custom resolve', run.bind(
  null,
  {
    resolve: {
      pathFilter: function (pkg, p, relativePath) {
        return relativePath.replace('xxx-', '')
      },
    },
  },
  {
    file: 'custom-resolve.css',
    source: '@import "./xxx-resolve";',
  },
  'resolve.expected.css'
))

