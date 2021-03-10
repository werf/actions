<p align="center">
  <img src="https://github.com/werf/werf/raw/master/docs/images/werf-logo.svg?sanitize=true" style="max-height:100%;" height="175">
</p>
___

This action set allows you to organize CI/CD with GitHub Actions and [werf](https://github.com/werf/werf). The set consists of several independent and complex actions:

- [werf/actions/converge](https://github.com/werf/actions/tree/master/converge)
- [werf/actions/build-and-publish](https://github.com/werf/actions/tree/master/build-and-publish)
- [werf/actions/build](https://github.com/werf/actions/tree/master/build)
- [werf/actions/publish](https://github.com/werf/actions/tree/master/build)
- [werf/actions/deploy](https://github.com/werf/actions/tree/master/deploy)
- [werf/actions/dismiss](https://github.com/werf/actions/tree/master/dismiss)
- [werf/actions/run](https://github.com/werf/actions/tree/master/run)
- [werf/actions/cleanup](https://github.com/werf/actions/tree/master/cleanup)

Each action combines all the necessary steps in itself and logic may be divided into environment setup and launching the corresponding command. 

**Ready-to-use GitHub Actions Workflows** for different CI/CD workflows are available [here](https://werf.io/documentation/advanced/ci_cd/github_actions.html#complete-set-of-configurations-for-ready-made-workflows).

> Also, there is another action — [werf/actions/install](https://github.com/werf/actions/tree/master/install). With this action a user can just install werf and use binary within job steps for own purposes

## Environment setup in details

### werf binary setup

By default, all actions setup actual werf version for [1.1 alpha channel](https://werf.io/releases.html) (more details about channels, werf release cycle and compatibility promise [here](https://github.com/werf/werf#backward-compatibility-promise)). 
Using the `channel` input the user can switch the release channel.

> This is recommended approach to be up-to-date and to use actual werf version without changing configurations
  
```yaml
- uses: werf/actions/converge@v1.1
  with:
    channel: alpha
```
  
Withal, it is not necessary to work within release channels, and the user might specify certain werf version with `version` input.

```yaml
- uses: werf/actions/converge@v1.1
  with:
    version: v1.1.23
```

### kubeconfig setup (*optional*)

The _kubeconfig_ may be used for deployment, cleanup, distributed locks and caches. Thus, the configuration should be added before step with the action or passed as base64 encoded data with `kube-config-base64-data` input:

* Prepare _kubeconfig_ (e.g. `cat ~/.kube/config | base64`) and save in GitHub Project Secrets (e.g. with name `KUBE_CONFIG_BASE64_DATA`).
 
* Pass secret with `kube-config-base64-data` input:
 
  ```yaml
  - uses: werf/actions/build-and-publish@v1.1
    with:
      kube-config-base64-data: ${{ secrets.KUBE_CONFIG_BASE64_DATA }}
  ```

### werf ci-env

This command performs _docker login_ using `github-token`, sets up predefined variables based on GitHub Workflow context.  
 
**Note** that `github-token` is optional in this action, and the input is there in case you need to use a non-default token.

By default, action will use the token provided to your workflow.

## Working with werf options

Any werf option can be defined with environment variables:

```yaml
- uses: werf/actions/build-and-publish@v1.1
  env:
    WERF_LOG_VERBOSE: "on"
    WERF_TAG_CUSTOM_TAG1: tag1
    WERF_TAG_CUSTOM_TAG2: tag2
```

## Working with container registry

Due to the fact that the new GitHub container registry (`ghcr.io`) does not currently support removal, all actions default to the old one (`docker.pkg.github.com`).

If necessary, the user can define an arbitrary container registry using the `WERF_REPO` and `WERF_REPO_CONTAINER_REGISTRY` environment variables.

```yaml
- uses: werf/actions/converge@v1.2
  env:
    WERF_REPO: "gcr.io/company/app"
    WERF_REPO_CONTAINER_REGISTRY: "gcr"
```

To learn how to work with the different container registries, see the corresponding [article in the werf documentation](https://werf.io/documentation/advanced/supported_container_registries.html).

## Examples

### converge

```yaml
converge:
  name: Converge
  runs-on: ubuntu-latest
  steps:

    - name: Checkout code
      uses: actions/checkout@v2
      with:
        fetch-depth: 0

    - name: Converge
      uses: werf/actions/converge@v1.1
      with:
        env: production
        kube-config-base64-data: ${{ secrets.KUBE_CONFIG_BASE64_DATA }}
```

### build, publish and deploy

```yaml
build-and-publish:
  name: Build and Publish
  runs-on: ubuntu-latest
  steps:

    - name: Checkout code
      uses: actions/checkout@v2
      with:
        fetch-depth: 0

    - name: Build and Publish
      uses: werf/actions/build-and-publish@v1.1
      with:
        kube-config-base64-data: ${{ secrets.KUBE_CONFIG_BASE64_DATA }}

deploy:
  name: Deploy
  needs: build-and-publish
  runs-on: ubuntu-latest
  steps:

    - name: Checkout code
      uses: actions/checkout@v2
      with:
        fetch-depth: 0

    - name: Deploy
      uses: werf/actions/deploy@v1.1
      with:
        env: production
        kube-config-base64-data: ${{ secrets.KUBE_CONFIG_BASE64_DATA }}
```

### dismiss

```yaml
dismiss: 
  name: Dismiss
  runs-on: ubuntu-latest
  steps:
  
    - name: Checkout code
      uses: actions/checkout@v2

    - name: Dismiss
      uses: werf/actions/dismiss@v1.1
      with:
        kube-config-base64-data: ${{ secrets.KUBE_CONFIG_BASE64_DATA }}
        env: production
```

### run 

```yaml
run: 
  name: Run
  runs-on: ubuntu-latest
  steps:
  
    - name: Checkout code
      uses: actions/checkout@v2
      with:
        fetch-depth: 0

    - name: Run
      uses: werf/actions/run@v1.1
      with:
        image: backend
        args: rails server
        kube-config-base64-data: ${{ secrets.KUBE_CONFIG_BASE64_DATA }}
      env:
        WERF_DOCKER_OPTIONS: "-d -p 3000:3000"
```

### cleanup

```yaml
cleanup: 
  name: Cleanup
  runs-on: ubuntu-latest
  steps:
  
    - name: Checkout code
      uses: actions/checkout@v2

    - name: Fetch all history for all tags and branches
      run: git fetch --prune --unshallow

    - name: Cleanup
      uses: werf/actions/cleanup@v1.1
      with:
        kube-config-base64-data: ${{ secrets.KUBE_CONFIG_BASE64_DATA }}
```

### install

```yaml
werf:
  name: werf 
  runs-on: ubuntu-latest
  steps:
  
    - name: Checkout code  
      uses: actions/checkout@v2

    - name: Install werf CLI  
      uses: werf/actions/install@v1.1
    
    # for deploy and distributed locks
    - name: Create kube config
      run: |
        KUBECONFIG=$(mktemp -d)/config
        base64 -d <(printf "%s" $KUBE_CONFIG_BASE64_DATA) > $KUBECONFIG
        echo KUBECONFIG=$KUBECONFIG >> $GITHUB_ENV
      env:
        KUBE_CONFIG_BASE64_DATA: ${{ secrets.KUBE_CONFIG_BASE64_DATA }}
  
    - name: Run werf commands
      run: |
        source $(werf ci-env github --as-file)
        werf build-and-publish
        werf deploy
      env:
        GITHUB_TOKEN: ${{ github.token }}
        WERF_ENV: production
```

# License

Apache License 2.0, see [LICENSE](LICENSE)
