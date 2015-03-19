#!/usr/bin/env node
var async = require('async'),
    agg = require('./'),
    yargs = require('yargs')
      .usage('$0 [options] <repos> <aggregate type> [aggregate options]')
      .demand(2)
      .describe('auth', 'your GitHub API access token (default: process.env.GITHUB_AUTH_TOKEN) or credentials in the form "username:password"')
      .describe('include', 'only include repo names with this glob-like pattern')
        .alias('include', 'i')
      .describe('exclude', 'exclude repos matching this glob-like pattern')
        .alias('exclude', 'e')
      .describe('parallel', 'do this many API requests in parallel')
        .default('parallel', 10)
        .alias('parallel', 'p')
      .describe('verbose', 'print helpful status messages to stderr')
        .boolean('verbose')
        .alias('verbose', 'v')
      .alias('h', 'help'),
    options = yargs.argv,
    auth = options.auth || process.env.GITHUB_AUTH_TOKEN,
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
  var match;
  if (match = auth && auth.match(/^(\w+):(.+)$/)) {
    auth = {
      username: match[1],
      password: match[2]
    };
  }

  var client = agg.client(auth),
      pattern = options.g;

  client.debug = options.verbose;

  async.waterfall([
    client.matchRepos(repos, {
      include: options.glob,
      exclude: options.exclude
    }),
    client.aggregate(type, {
      parallel: options.parallel
    }, aggArgs)
  ], done);
}

