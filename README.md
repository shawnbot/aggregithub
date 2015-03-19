# aggregithub
Aggregate your GitHub statistics for fun and profit!

### Installation
Install with [npm](http://npmjs.com/):

```sh
npm install -g aggregithub
```

### Usage
`aggregithub` is a command-line tool that generates JSON on [standard output](http://en.wikipedia.org/wiki/Standard_streams#Standard_output_.28stdout.29):

```
aggregithub [options] <repos> <aggregate type> [aggregate options]

Options:
  --auth          your GitHub API access token (default: process.env.GITHUB_AUTH_TOKEN)
                  or credentials in the form "username:password"
  --include, -i   only include repo names with this glob-like pattern
  --exclude, -e   exclude repos matching this glob-like pattern
  --parallel, -p  do this many API requests in parallel [default: 10]
```

**Note:** you will very likely run into [GitHub API rate limits](https://developer.github.com/v3/rate_limit/)
if you don't provide the `--auth` option or set the `GITHUB_AUTH_TOKEN`
 [environment variable](http://en.wikipedia.org/wiki/Environment_variable). You can get a personal access token on [your GitHub settings page](https://github.com/settings/applications), then export it like so:

```sh
export GITHUB_AUTH_TOKEN="your-super-secret-token"
```

You should also considering putting this in a `.env` file and using [autoenv](https://github.com/kennethreitz/autoenv) to have it sourced whenever you enter the directory that contains it. However you decide to do it, **remember to back up your token somewhere safe**, because you won't be able to get it from GitHub again.

### Examples

Get commit totals for a user's repos:
```sh
aggregithub users/shawnbot commits total > shawnbot-commits.json
```

Get daily and weekly commit totals for an organization:
```sh
aggregithub orgs/18F commits > 18F-commits.json
```


### Available Statistics

#### `commits [rollup types]`
Uses the [commit activity API](https://developer.github.com/v3/repos/statistics/#commit-activity)
to get total, daily and weekly commit counts **within the last year**. Rollup types are any of the following:

* `total`: the total number of commits
* `weekly`: weekly rollups as an object with keys in the form `YYYY-MM-DD`
* `daily`: daily rollups as an object with keys in the form `YYYY-MM-DD`

For instance:

```sh
$ aggregithub users/username commits total
{
  "total": 520
}
```

#### `issues [event types]`
Looks at all of the [issue events](https://developer.github.com/v3/issues/events/#list-events-for-a-repository) for one or more repositories and rolls up the number of events by type. If no event types are provided, the default is to list `opened` and `closed` events. Examples:

```sh
# just list opened and closed
$ aggregithub users/username issues
{
  "opened": 200,
  "closed": 100
}
# list opened, closed and PRs merged
$ aggregithub users/username issues opened closed merged
{
  "opened": 200,
  "closed": 100,
  "merged": 50
}
```
