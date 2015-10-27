var postcss = require('postcss')
var promisify = require('node-promisify')
var mix = require('util-mix')
var fs = require('fs')
var path = require('path')
var resolver = require('custom-resolve')
var glob = promisify(require('glob'))

module.exports = postcss.plugin('postcss-simple-import', atImport)

function atImport(opts) {
  opts = mix({
    atRule: 'import',
    cache: {},
  }, opts)

  if (typeof opts.resolve !== 'function') {
    opts.resolve = promisify(resolver(mix({
      packageEntry: 'style',
      extensions: '.css',
      symlinks: true,
    }, opts.resolve)))
  }
  if (typeof opts.parse !== 'function') {
    opts.parse = function (row) {
      return Promise.resolve(
        postcss.parse(row.source, { from: row.file })
      )
    }
  }
  if (typeof opts.readFile !== 'function') {
    opts.readFile = promisify(fs.readFile)
  }
  if (opts.glob === true) {
    opts.glob = glob
  }

  return function (root, result) {
    var state = mix({
      from: result.opts.from,
      processed: {},
    }, opts)
    state.processed[state.from] = true
    return processRoot(state, root)
  }
}

function processRoot(opts, root) {
  return parseAtRules(root, opts.atRule)
    .then(function (rules) {
      return Promise.all(
        rules.map(processRule.bind(null, opts))
      )
    })
    .then(function () {
      return { root: root, from: opts.from }
    })
}

function parseAtRules(root, name) {
  var rules = []
  root.walkAtRules(name, function (rule) {
    rules.push(rule)
  })
  return Promise.resolve(rules)
}

function prepareToProcess(file, opts) {
  var processed = opts.processed[file]
  if (!processed) {
    opts.processed[file] = true
  }
  return processed
}

function processRule(opts, rule) {
  return Promise.resolve(trim(rule.params))
    .then(function (url) {
      if (typeof opts.importer === 'function') {
        return opts.importer(url, opts)
      }
      return resolveFilename(url, opts).then(function (files) {
        return [].concat(files).map(function (file) {
          return { file: file }
        })
      })
    })
    .then(function (rows) {
      return Promise.all([].concat(rows).map(function (row) {
        if (prepareToProcess(row.file, opts)) {
          return Promise.resolve()
        }
        return Promise.resolve(typeof row.source === 'string')
          .then(function (hasSource) {
            if (hasSource) {
              return row
            }
            return readFile(row.file, opts).then(function (src) {
              row.source = src
              return row
            })
          })
          .then(opts.parse)
          .then(processRoot.bind(null, mix({}, opts, { from: row.file })))
      }))
    })
    .then(function (results) {
      results.filter(Boolean)
        .sort(function (p, q) {
          return p.from < q.from ? -1 : 1
        })
        .map(function (result) {
          return result.root
        })
        .forEach(insertBefore.bind(null, rule))
    })
    .then(function () {
      rule.remove()
    })
}

function trim(s) {
  return s && s.replace(/['"]/g, '').trim()
}

function resolveFilename(id, opts) {
  var base = path.dirname(opts.from)
  if (opts.glob && opts.glob.hasMagic(id)) {
    // only handles local modules
    return opts.glob(id, { cwd: base })
      .then(function (files) {
        return files.map(function (file) {
          return path.resolve(base, file)
        })
      })
  }
  return opts.resolve(id, { basedir: base })
}

function readFile(file, opts) {
  var c = opts.cache[file]
  if (c) {
    return Promise.resolve(c)
  }
  c = opts.readFile(file, 'utf8')
  opts.cache[file] = c
  return c
}

function insertBefore(rule, child) {
  var childNodes = child && child.nodes || []
  if (childNodes.length) {
    childNodes[0].raws.before = rule.raws.before
  }
  childNodes.forEach(function (node) {
    node.parent = rule.parent
    rule.parent.insertBefore(rule, node)
  })
}

