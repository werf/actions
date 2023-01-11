<p align="center">
  <img src="https://werf.io/assets/images/werf-logo.svg?sanitize=true" style="max-height:100%;" height="175">
</p>
___

This action allows you to organize CI/CD with GitHub Actions and [werf](https://github.com/werf/werf).

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
    
    - name: Install werf
      uses: werf/actions/install@v1.2
      
    - name: Run script
      run: |
        . $(werf ci-env github --as-file) 
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
- uses: werf/actions/install@v1.1
    
# Setup actual werf version within 1.2 alpha channel.
- uses: werf/actions/install@v1.2
```

By default, the action installs actual werf version within alpha channel (more details about channels, werf release cycle and compatibility promise [here](https://werf.io/installation.html#all-changes-in-werf-go-through-all-stability-channels)). 
Using the `channel` input the user can switch the release channel.

> This is recommended approach to be up-to-date and to use actual werf version without changing configurations.
  
```yaml
- uses: werf/actions/install@v1.2
  with:
    channel: alpha
```
  
Withal, it is not necessary to work within release channels, and the user might specify certain werf version with `version` input.

```yaml
- uses: werf/actions/install@v1.2
  with:
    version: v1.2.9
```

## FAQ

### werf always rebuilds images on new commit

Make sure to use `fetch-depth: 0` setting in the checkout action, like follows:

```
- name: Checkout code
  uses: actions/checkout@v2
  with:
    fetch-depth: 0
```

By default, fetch-depth set to `1` which disables git history when checking out code. werf cache selection algorithm uses git history to determine whether some image bound to some commit could be used as a cache when building current commit (current commit should be descendant to the cache commit).

Setting `fetch-depth` to `0` enables full fetch of git history and it is a **recommended** approach. It is also possible to limit fetch history with some decent number of commits, which would enable images caching limited to that number of commits, but this would have a negative impact on cache reproducibility.

## License

Apache License 2.0, see [LICENSE](LICENSE)
