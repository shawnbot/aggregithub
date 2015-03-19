var octonode = require('octonode'),
    url = require('url'),
    querystring = require('querystring'),
    curry = require('curry'),
    async = require('async'),
    minimatch = require('minimatch'),
    parseLinks = require('parse-link-header'),
    extend = require('extend'),
    stats = require('./lib/stats'),
    sort = require('./lib/sort');

module.exports = {
  version: require('./package.json').version,
  client: client,
  stats: stats
};

function client() {
  var client = octonode.client.apply(octonode, arguments),
      get = client.get.bind(client);

  client.get = curry(function(uri, params, done) {
    var data = expand(uri, params);
    return get(data.uri, data.params, done);
  });

  client.getAll = curry(function(uri, params, done) {
    params.page = 1;
    var data = [],
        last = '?',
        next = function() {
          log('get: %s (page %d of %s)', uri, params.page, last, JSON.stringify(params));
          return client.get(uri, params, handler);
        },
        handler = function(error, status, page, headers) {
          if (error) {
            return done(error);
          } else if (!Array.isArray(page)) {
            return done('expected array; got ' + typeof page);
          }

          if (!page.length) {
            log('nothing in this page:', params.page);
            return done(null, data);
          }
          data = data.concat(page);
          var links = parseLinks(headers.link);
          if (links && links.next) {
            last = links.last ? links.last.page : '?';
            params.page = +links.next.page;
            return next();
          } else {
            return done(null, data);
          }
        };

    return next();
  });

  client.matchRepos = curry(function(repos, options, done) {
    var include = options.include;

    if (typeof repos === 'string') {
      var path = repos;
      if (path.charAt(0) === '/') {
        path = path.substr(1);
      }
      var bits = path.split('/');
      switch (bits.length) {
        case 1:
          path = 'users/' + path;
          break;
        case 2:
          break;
        case 3:
          path = bits.slice(0, -1).join('/');
          include = bits[2];
          break;
      }
      repos = client.getAll('/' + path + '/repos', {per_page: 100});
    }

    var test = (include && include !== '*')
      ? function(repo) {
        log("minimatch('%s', '%s')", repo.name, include);
        return minimatch(repo.name, include);
      }
      : function() { return true; };

    if (options.exclude) {
      var exclude = options.exclude,
          _test = test;
      test = function(repo) {
        return _test(repo) && !minimatch(repo.name, exclude);
      };
    }

    switch (typeof repos) {
      case 'function':
        return async.waterfall([
          repos,
          function (repos, next) {
            log('matching %d repos against', repos.length, options);
            repos.sort(function(a, b) {
              return sort.ascending(a.name, b.name);
            });
            var filtered = repos.filter(test);
            log('got %d matches: %s', filtered.length, filtered.map(function(d) { return d.name; }).join(', '));
            next(null, filtered);
          }
        ], done);

      case 'object':
        return done(null, repos.filter(test));
    }
  });

  client.stats = stats;

  client.aggregate = curry(function(type, options, args, repos, done) {
    var agg = client.stats[type];
    if (!agg) {
      return done('no such aggregate statistic: ' + type);
    }
    var limit = 10; // +options.parallel || 1;
    log('getting %s stats for %d repo(s)...', type, repos.length);

    async.mapLimit(repos, limit, function(repo, next) {
      log('getting %s stats for %s/%s', type, repo.owner.login, repo.name);
      agg.fetch(client, repo, args, function(error, stats) {
        if (error) return done(error);
        if (!repo.stats) repo.stats = {};
        repo.stats[type] = stats;
        next(null, repo);
      });
    }, function(error) {
      if (error) return done(error);
      var reduce = client.stats[type].reduce;
      return done(null, reduce ? reduce(repos, args) : repos);
    });
  });

  client.debug = false;

  function log() {
    if (!client.debug) return;
    console.warn.apply(console, arguments);
  }

  client.log = log;

  return client;
}

function expand(uri, params) {
  params = extend({}, params);
  for (var key in params) {
    if (!params[key]) delete params[key];
  }
  uri = uri.replace(/:(\w+)/g, function(_, key) {
    var value = params[key];
    delete params[key];
    return value;
  });
  return {uri: uri, params: params};
}
