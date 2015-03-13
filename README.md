# aggregithub
Aggregate your GitHub statistics for fun and profit!

## Installation
Install with [npm](http://npmjs.com/):

```sh
npm install -g aggregithub
```

## Usage
`aggregithub` is a command-line tool that generates JSON on [standard output](http://en.wikipedia.org/wiki/Standard_streams#Standard_output_.28stdout.29):

```
aggregithub [options] <repos> <aggregate type> [aggregate options]

Options:
  -g       only match repo names with this glob-like pattern
  --token  your GitHub API access token (default: process.env.GITHUB_AUTH_TOKEN)
```

**Note:** you will very likely run into [GitHub API rate limits](https://developer.github.com/v3/rate_limit/)
if you don't provide the `--token` option or set the `GITHUB_AUTH_TOKEN`
 [environment variable](http://en.wikipedia.org/wiki/Environment_variable). You can get a personal access token on [your GitHub settings page](https://github.com/settings/applications), then export it like so:

```sh
export GITHUB_AUTH_TOKEN="your-super-secret-token"
```

You should also considering putting this in a `.env` file and using [autoenv](https://github.com/kennethreitz/autoenv) to have it sourced whenever you enter the directory that contains it. However you decide to do it, **remember to back up your token somewhere safe**, because you won't be able to get it from GitHub again.

## Examples

Get commit totals for a user's repos:
```sh
aggregithub users/shawnbot commits total > shawnbot-commits.json
```

Get daily and weekly commit totals for an organization:
```sh
aggregithub orgs/18F commits > 18F-commits.json
```


## Available Statistics

### `commits`
Uses the [commit activity API](https://developer.github.com/v3/repos/statistics/#commit-activity)
to get total, daily and weekly commit counts *within the last year*.

### More coming soon!
