var test = require('tap').test
var run = require('./util/run')

test('glob', run.bind(
  null,
  { glob: true },
  { file: 'glob_imports/glob.css', source: '@import "*.css";' },
  { source: 'a {}b {}c {}' }
))

