<p align="center">
  <img src="https://werf.io/assets/images/werf-logo.svg?sanitize=true" style="max-height:100%;" height="175">
</p>
___

This action allows you to organize CI/CD with GitHub Actions and [werf](https://github.com/werf/werf). The action combines all the necessary steps in itself: [werf installation](#versioning) and [environment setup](#environment-setup).

**Ready-to-use GitHub Actions Workflows** for different CI/CD workflows are available [here](https://werf.io/documentation/v1.2/advanced/ci_cd/github_actions.html#complete-set-of-configurations-for-ready-made-workflows).

## How to use

```yaml
converge:
  name: Converge
  runs-on: ubuntu-latest
  steps:

    - name: Checkout code
      uses: actions/checkout@v2
      with:
        fetch-depth: 0
    
    - name: Setup werf
      uses: werf/actions/setup@v1.2
      
    - name: Run script
      run: |
        werf render
        werf converge
      env:
        WERF_KUBECONFIG_BASE64: ${{ secrets.KUBE_CONFIG_BASE64_DATA }}
        WERF_ENV: production
```

## Versioning

When using action, select the version corresponding to the required `MAJOR.MINOR` version of werf:

```yaml
# Setup actual werf version within 1.1 alpha channel.
- uses: werf/actions/setup@v1.1
    
# Setup actual werf version within 1.2 alpha channel.
- uses: werf/actions/setup@v1.2
```

By default, the action installs actual werf version within alpha channel (more details about channels, werf release cycle and compatibility promise [here](https://werf.io/installation.html#all-changes-in-werf-go-through-all-stability-channels)). 
Using the `channel` input the user can switch the release channel.

> This is recommended approach to be up-to-date and to use actual werf version without changing configurations.
  
```yaml
- uses: werf/actions/setup@v1.2
  with:
    channel: alpha
```
  
Withal, it is not necessary to work within release channels, and the user might specify certain werf version with `version` input.

```yaml
- uses: werf/actions/setup@v1.2
  with:
    version: v1.2.9
```

## Environment setup

This is the step where the action: 

- sets the defaults for werf command options based on [GitHub Workflow environment variables](https://docs.github.com/en/actions/reference/environment-variables) (e.g. container repository address to the `WERF_REPO` environment variable using the following pattern: `ghcr.io/$GITHUB_REPOSITORY/<project-from-werf.yaml>`).
- performs _docker login_ to `ghcr.io` using the `github-token` input (only if `ghcr.io` used as `WERF_REPO`).

> The `github-token` input is optional, and the input is there in case you need to use a non-default token. By default, an action will use [the token provided to your workflow](https://docs.github.com/en/actions/reference/authentication-in-a-workflow#about-the-github_token-secret).

## Cleaning up container registry

The action generates the default container repository address and performs _docker login_ to the registry within [werf ci-env step](#werf-ci-env).

For cleanup action, the user needs [to create personal access token](https://docs.github.com/en/github/authenticating-to-github/keeping-your-account-and-data-secure/creating-a-personal-access-token) with `read:packages` and `delete:packages` scope and uses it as the `WERF_REPO_GITHUB_TOKEN` environment variable or the `github-token` input. It is recommended [to store the token as a secret](https://help.github.com/en/actions/configuring-and-managing-workflows/creating-and-storing-encrypted-secrets).

```yaml
- name: Setup werf
  uses: werf/actions/setup@v1.2  

- name: Cleanup
  run: werf cleanup
  env:
    WERF_KUBECONFIG_BASE64: ${{ secrets.KUBE_CONFIG_BASE64_DATA }}
    WERF_REPO_GITHUB_TOKEN: ${{ secrets.WERF_CLEANUP_PAM }}
```

> To learn about how to work with the different container registries, see the appropriate [article in the werf documentation](https://werf.io/documentation/v1.2/advanced/supported_container_registries.html).

## FAQ

### werf always rebuilds images on new commit

Make sure to use `fetch-depth: 0` setting in the checkout action, like follows:

```
- name: Checkout code
  uses: actions/checkout@v2
  with:
    fetch-depth: 0
```

By default fetch-depth set to `1` which disables git history when checking out code. werf cache selection algorithm uses git history to determine whether some image bound to some commit could be used as a cache when building current commit (current commit should be descendant to the cache commit).

Setting `fetch-depth` to `0` enables full fetch of git history and it is a **recommended** approach. It is also possible to limit fetch history with some decent number of commits, which would enable images caching limited to that number of commits, but this would have a negative impact on cache reproducibility.

## License

Apache License 2.0, see [LICENSE](LICENSE)
