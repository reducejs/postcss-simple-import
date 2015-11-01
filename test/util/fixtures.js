var path = require('path')
var fixtures = path.resolve.bind(
  path, __dirname, '..', 'fixtures'
)

module.exports = fixtures
module.exports.one = function (x) {
  return fixtures(x)
}

