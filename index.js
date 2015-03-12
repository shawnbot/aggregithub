var octonode = require('octonode'),
    url = require('url'),
    querystring = require('querystring'),
    curry = require('curry'),
    async = require('async'),
    minimatch = require('minimatch'),
    parseLinks = require('parse-link-header'),
    stats = require('./lib/stats');

module.exports = {
  client: client,
  stats: stats
};

function client() {
  var client = octonode.client.apply(octonode, arguments),
      get = client.get.bind(client);

  client.get = curry(function(uri, params, done) {
    uri = expand(uri, params);
    return get(uri, uri.params, done);
  });

  client.getAll = curry(function(uri, params, done) {
    params.page = 1;

    var data = [],
        next = function() {
          console.warn('getting page:', params.page, uri, params);
          return client.get(uri, params, handler);
        },
        handler = function(error, status, page, headers) {
          if (error) {
            return done(error);
          } else if (!Array.isArray(page)) {
            return done('expected array; got ' + typeof page);
          }

          data = data.concat(page);
          var links = parseLinks(headers.link);
          if (links.next && links.next.page > params.page) {
            params.page++;
            return next();
          } else {
            return done(null, data);
          }
        };

    return next();
  });

  client.matchRepos = curry(function(repos, pattern, done) {
    if (typeof repos === 'string') {
      var path = repos;
      if (path.charAt(0) === '/') {
        path = path.substr(1);
      }
      var bits = path.split('/'),
          pattern;
      // console.warn('bits:', bits);
      switch (bits.length) {
        case 1:
          path = 'users/' + path;
          break;
        case 2:
          break;
        case 3:
          path = bits.slice(0, -1).join('/');
          pattern = bits[2];
          break;
      }
      repos = client.getAll('/' + path + '/repos', {});
    }

    var test = (pattern && pattern !== '*')
      ? function(repo) { return minimatch(repo.name, pattern); }
      : function() { return true; };

    switch (typeof repos) {
      case 'function':
        return async.waterfall([
          repos,
          function (repos, next) {
            console.warn('got %d repos', repos.length);
            next(null, repos.filter(test));
          }
        ], done);

      case 'object':
        return done(null, repos.filter(test));
    }
  });

  client.stats = stats;

  client.aggregate = curry(function(type, args, repos, done) {
    if (!client.stats[type]) {
      return done('no such aggregate statistic: ' + type);
    }
    var uri = '/repos/:owner/:repo/stats/:stat';
    async.mapLimit(repos, args.limit || 10, function(repo, next) {
      console.warn('getting stats for %s/%s', repo.owner.login, repo.name);
      client.get(uri, {
        owner: repo.owner.login,
        repo: repo.name,
        stat: type
      }, function(error, status, stats, headers) {
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

  return client;
}

function expand(uri, params) {
  params = Object.create(params);
  uri = uri.replace(/:(\w+)/g, function(_, key) {
    var value = params[key];
    delete params[key];
    return value;
  });
  uri.params = params;
  return uri;
}
