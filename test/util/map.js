module.exports = function (keys, values) {
  return keys.reduce(function (o, k, i) {
    o[k] = values ? values[i] : true
    return o
  }, {})
}
