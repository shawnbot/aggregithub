# aggregithub
Aggregate your GitHub statistics for fun and profit!

```
aggregithub [options] <repos> <aggregate type> [aggregate options]

Options:
  -g       only match repo names with this glob-like pattern
  --token  your GitHub API access token (default: process.env.GITHUB_AUTH_TOKEN)
```

**Note:** you *will* run into [GitHub API rate limits](https://developer.github.com/v3/rate_limit/)
if you don't provide the `--token` option or set the `GITHUB_AUTH_TOKEN`
environment variable.

## Examples

Get commit totals for a user's repos:

```
aggregithub users/shawnbot commits total > shawnbot-commits.json
```

Get daily and weekly commit totals for an organization:

```
aggregithub orgs/18F commits > shawnbot-commits.json
```
