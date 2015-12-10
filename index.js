var postcss = require('postcss')
var mix = require('mixy')
var fs = require('fs')
var path = require('path')
var resolver = require('custom-resolve')

var promisify = require('node-promisify')
var glob = promisify(require('glob'))
var series = require('async-array-methods').series

module.exports = postcss.plugin('postcss-simple-import', atImport)

function atImport(opts) {
  var emitter = createEmitter()
  opts = mix({
    atRule: 'import',
    // cache raw contents
    // we cann't cache final contents, if we want to dedupe
    // for example
    // @import "c.css";@import "a.css";@import "b.css";
    // if "a.css" imports "c.css" and "b.css", and we cache final contents
    // then there is no way to prevent "c.css" from being loaded twice
    cache: {},
    emitter: emitter,
  }, opts)

  if (opts.on) {
    Object.keys(opts.on).forEach(function (evt) {
      emitter.on(evt, opts.on[evt])
    })
  }
  if (typeof opts.resolve !== 'function') {
    opts.resolve = promisify(resolver(mix({
      main: 'style',
      extensions: '.css',
      symlink: true,
    }, opts.resolve)))
  }
  if (typeof opts.parse !== 'function') {
    opts.parse = function (source, from) {
      return Promise.resolve(
        postcss.parse(source, { from: from })
      )
    }
  }
  if (typeof opts.readFile !== 'function') {
    opts.readFile = promisify(function (file, cb) {
      fs.readFile(file, 'utf8', cb)
    })
  }
  if (opts.glob === true) {
    opts.glob = glob
  }

  return function (root, result) {
    var state = mix({}, opts, {
      processed: {},
      postcssOpts: result.opts,
    })
    return processRow({
      root: root,
      from: result.opts.from,
    }, state)
  }
}

function processRow(row, opts) {
  var from = row.from

  if (opts.processed[from]) {
    return Promise.resolve()
  }
  opts.processed[from] = true

  if (row.root) {
    return processRoot(row.root, from, opts)
  }

  if (row.source) {
    opts.cache[from] = row.source
  }

  if (opts.cache[from]) {
    return processSource(opts.cache[from], from, opts)
  }

  return opts.readFile(from)
    .then(function (source) {
      opts.cache[from] = source
      return processSource(source, from, opts)
    })
}

function processSource(source, from, opts) {
  return opts.parse(source, from)
    .then(function (root) {
      return processRoot(root, from, opts)
    })
}

function processRoot(root, from, opts) {
  var rules = []
  root.walkAtRules(opts.atRule, function (rule) {
    rules.push(rule)
  })
  // DO NOT use `Promise.all`,
  // cause we want to preserve import order
  // e.g. "a.css"
  // @import "b.css";@import "c.css"
  // while "b.css" imports "c.css" to do something
  // if we use `.all`, then in the final contents of "a.css",
  // css rules from "b.css" will come before those from "c.css"
  return series(rules, function (rule) {
    return processRule(rule, from, opts)
  })
    .then(function (rows) {
      return [].concat.apply([], rows)
        .reduce(function (o, r) {
          o[r.from] = true
          return o
        }, {})
    })
    .then(function (imports) {
      // the direct imports
      if (opts.onImport) {
        opts.onImport(from, Object.keys(imports), opts.postcssOpts)
      }
      opts.emitter.emit('imports', Object.keys(imports), from, opts)
      return {
        root: root,
        from: from,
        imports: imports,
      }
    })
}

function processRule(rule, from, opts) {
  var url = trim(rule.params)
  return Promise.resolve()
    .then(function () {
      if (typeof opts.importer === 'function') {
        return opts.importer(url, from, opts)
      }
    })
    .then(function (rows) {
      if (rows) {
        return rows
      }
      return resolveFilename(url, from, opts)
        .then(function (files) {
          return [].concat(files).map(function (file) {
            return { from: file }
          })
        })
    })
    .then(function (rows) {
      // we don't preseve order for globs
      return [].concat(rows)
        .map(function (row) {
          opts.emitter.emit('import', row.from, from, opts)
          return processRow(row, opts)
        })
    })
    .then(Promise.all.bind(Promise))
    .then(function (rows) {
      return rows.filter(Boolean)
        .map(function (row) {
          insertBefore(rule, row.root)
          return row
        })
    })
    .then(function (imported) {
      rule.parent.nodes.splice(rule.parent.nodes.indexOf(rule), 1)
      return imported
    })
}

function resolveFilename(id, from, opts) {
  var base = path.dirname(from)
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

function insertBefore(rule, child) {
  var childNodes = child && child.nodes || []
  if (childNodes.length) {
    childNodes[0].raws.before = rule.raws.before
  }
  childNodes.forEach(function (node) {
    node.parent = rule.parent
    // DO NOT use insertBefore
    // declarations like `*display:none` will be transformed to `display:none`
    //rule.parent.insertBefore(rule, node)
  })
  var nodes = rule.parent.nodes
  nodes.splice.apply(nodes, [ nodes.indexOf(rule), 0 ].concat(childNodes))
}

function createEmitter() {
  var emitter = new (require('events'))
  emitter.setMaxListeners(0)
  return emitter
}

function trim(s) {
  return s && s.replace(/['"]/g, '').trim()
}

