var moment = require('moment');

module.exports = {
  'commit_activity': {
    reduce: reduceCommitActivity
  }
};

function reduceCommitActivity(repos, args) {

  var stats = repos.map(function(d) {
    return d.stats.commit_activity;
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
        console.warn('no daily stats; skipping');
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

  var result = {
    type: 'commits'
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
    .sort(ascending);

  result.dates = {
    start: dates[0],
    end: dates[dates.length - 1]
  };
  return result;
}

function dateify(time, format) {
  return moment(new Date(time * 1000)).format(format || 'YYYY-MM-DD');
}

function ascending(a, b) {
  return a > b ? 1 : a < b ? -1 : 0;
}

function descending(a, b) {
  return a > b ? -1 : a < b ? 1 : 0;
}
