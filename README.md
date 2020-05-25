<p align="center">
  <img src="https://github.com/flant/werf/raw/master/docs/images/werf-logo.svg?sanitize=true" style="max-height:100%;" height="175">
</p>
___

This action set allows you to organize CI/CD with GitHub Actions and [werf](https://github.com/flant/werf). The set consists of four independent complex actions:

- [flant/werf-actions/converge](https://github.com/flant/werf-actions/tree/master/converge)
- [flant/werf-actions/build-and-publish](https://github.com/flant/werf-actions/tree/master/build-and-publish)
- [flant/werf-actions/deploy](https://github.com/flant/werf-actions/tree/master/deploy)
- [flant/werf-actions/cleanup](https://github.com/flant/werf-actions/tree/master/cleanup)

Each action combines all the necessary steps in itself and logic may be divided into __environment setup__ and launching the corresponding command.

> Also, there is another action — [flant/werf-actions/install](https://github.com/flant/werf-actions/tree/master/install). With this action a user can just install werf and use binary within job steps for own purposes

## Environment setup in details

### werf binary setup

By default, all actions setup actual werf version for [1.1 stable channel](https://werf.io/releases.html) (more details about channels, werf release cycle and compatibility promise [here](https://github.com/flant/werf#backward-compatibility-promise)). 
Using `group` and `channel` inputs the user can switch the release channel.

> This is recommended approach to be up-to-date and to use actual werf version without changing configurations
  
```yaml
- uses: flant/werf-actions/converge@v1
  with:
    group: 1.1
    channel: alpha
```
  
Withal, it is not necessary to work within release channels, and the user might specify certain werf version with `version` input.

```yaml
- uses: flant/werf-actions/converge@v1
  with:
    version: v1.1.16
```

### kubeconfig setup (*optional*)

The _kubeconfig_ may be used for deployment, cleanup, distributed locks and caches. Thus, the configuration should be added before step with the action or passed as base64 encoded data with `kube-config-base64-data` input:

* Prepare _kubeconfig_ (e.g. `cat ~/.kube/config | base64`) and save in GitHub Project Secrets (e.g. with name `KUBE_CONFIG_BASE64_DATA`).
 
* Pass secret with `kube-config-base64-data` input:
 
  ```yaml
  - uses: flant/werf-actions/build-and-publish@v1
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
- uses: flant/werf-actions/build-and-publish@v1
  env:
    WERF_LOG_VERBOSE: "on"
    WERF_TAG_CUSTOM_TAG1: tag1
    WERF_TAG_CUSTOM_TAG2: tag2
```

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
      uses: flant/werf-actions/converge@master
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
      uses: flant/werf-actions/build-and-publish@master
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
      uses: flant/werf-actions/deploy@master
      with:
        env: production
        kube-config-base64-data: ${{ secrets.KUBE_CONFIG_BASE64_DATA }}
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
      uses: flant/werf-actions/cleanup@v1
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
      uses: actions/checkout@v1

    - name: Install werf CLI  
      uses: flant/werf-actions/install@v1
    
    # for deploy and distributed locks
    - name: Create kube config
      run: |
        KUBECONFIG=$(mktemp -d)/config
        base64 -d <(printf "%s" $KUBE_CONFIG_BASE64_DATA) > $KUBECONFIG
        echo ::set-env name=KUBECONFIG::$KUBECONFIG
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
