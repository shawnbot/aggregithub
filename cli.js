#!/usr/bin/env node
var async = require('async'),
    agg = require('./index'),
    yargs = require('yargs')
      .usage('$0 [options] <repos> <aggregate type> [aggregate options]')
      .demand(2)
      .describe('g', 'only match repo names with this glob-like pattern')
      .describe('token', 'your GitHub API access token (default: process.env.GITHUB_AUTH_TOKEN)')
      .alias('h', 'help'),
    options = yargs.argv,
    auth = options.token || process.env.GITHUB_AUTH_TOKEN,
    args = options._,
    repos = args[0],
    type = args[1],
    aggArgs = args.slice(2);

main(function(error, data) {
  if (error) {
    console.error('error:', error);
    return process.exit(1);
  }

  var out = options.out
    ? fs.createWriteStream(options.out)
    : process.stdout;

  out.write(JSON.stringify(data, null, '  '));
});

function main(done) {
  var client = agg.client(auth),
      pattern = options.g;
  async.waterfall([
    client.matchRepos(repos, pattern),
    client.aggregate(type, aggArgs)
  ], done);
}

