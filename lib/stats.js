var moment = require('moment'),
    extend = require('extend'),
    async = require('async'),
    sort = require('./sort');

module.exports = {
  'commits': statsBuilder('commit_activity', reduceCommitActivity),
  'issues': {
    fetch: fetchIssues,
    reduce: reduceIssues
  }
};

function statsBuilder(type, reduce) {
  var uri = '/repos/:owner/:repo/stats/:stat';
  return {
    type: type,
    fetch: function(client, repo, args, done) {
      client.get(uri, {
        owner: repo.owner.login,
        repo: repo.name,
        stat: type
      }, function(error, status, stats, headers) {
        // console.warn('got stats:', stats);
        return done(error, stats);
      });
    },
    reduce: reduceCommitActivity
  }
}

function fetchIssues(client, repo, types, done) {
  if (!types || !types.length) types = ['opened', 'closed', 'merged'];

  var data = {
    owner: repo.owner.login,
    repo: repo.name,
    per_page: 100
  };

  async.waterfall([
    function(done) {
      // don't fetch issues if "opened" isn't one of the types
      if (types.indexOf('opened') === -1) {
        return done(null, {});
      }
      var d = extend({state: 'all'}, data);
      client.getAll('/repos/:owner/:repo/issues', d, function(error, issues) {
        if (error) return done(error);
        client.log('got %d open issues', issues.length);
        return done(null, {opened: issues.length});
      });
    },
    function(rollup, done) {
      var d = extend({event: types.join(',')}, data);
      client.getAll('/repos/:owner/:repo/issues/events', d, function(error, events) {
        if (error) {
          client.log('events error:', error);
          return done(error);
        }
        events.forEach(function(e) {
          var type = e.event;
          switch (type) {
            case 'reopened':
              type = 'opened';
              break;
            case 'merged':
              type = 'closed';
              break;
          }
          if (e.event in types) {
            rollup[e.event]++;
          } else {
            rollup[e.event] = 1;
          }
        });
        client.log('issue events for %s/%s:', data.owner, data.repo, rollup);
        return done(null, rollup);
      });
    }
  ], done);
}

function reduceIssues(repos, types) {
  if (!types) {
    return repos.reduce(function(agg, repo) {
      var stats = repo.stats.issues;
      for (var type in stats) {
        agg[type] = (agg[type] || 0) + stats[type];
      }
      return agg;
    }, {});
  }

  var agg = {};
  types.forEach(function(type) { agg[type] = 0; });
  return repos.reduce(function(agg, repo) {
    var stats = repo.stats.issues;
    types.forEach(function(type) {
      agg[type] = (agg[type] || 0) + (stats[type] || 0);
    });
    return agg;
  }, agg);
}

function reduceCommitActivity(repos, args) {
  var result = {
    type: 'commits'
  };

  var stats = repos.map(function(d) {
        return d.stats.commits;
      })
      .reduce(function(list, d) {
        return list.concat(d);
      }, []);

  var reduce = {};

  reduce.total = function(stats) {
    return stats.reduce(function(total, d) {
      return total + d.total;
    }, 0);
  };

  reduce.daily = function(stats) {
    return stats.reduce(function(data, d) {
      var time = d.week,
          step = 24 * 60 * 60;
      if (!d.days) {
        // console.warn('no daily stats; skipping');
        return data;
      }
      d.days.forEach(function(count, day) {
        var key = dateify(time);
        if (data[key]) {
          data[key] += count;
        } else {
          data[key] = count;
        }
        time += step;
      });
      return data;
    }, {});
  };

  reduce.weekly = function(stats) {
    return stats.reduce(function(data, d) {
      var key = dateify(d.week);
      if (data[key]) {
        data[key] += d.total;
      } else {
        data[key] = d.total;
      }
      return data;
    }, {});
  };

  // always include the total
  result.total = reduce.total(stats);

  if (!args || !args.length) {
    args = ['weekly', 'daily'];
  }

  args.forEach(function(arg) {
    if (result[arg]) return;
    result[arg] = reduce[arg](stats);
  });

  var dates = Object.keys(result.daily || reduce.daily(stats))
    .sort(sort.ascending);

  result.dates = {
    start: dates[0],
    end: dates[dates.length - 1]
  };
  return result;
}

function dateify(time, format) {
  return moment(new Date(time * 1000)).format(format || 'YYYY-MM-DD');
}
