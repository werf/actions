<p align="center">
  <img src="https://github.com/werf/werf/raw/master/docs/images/werf-logo.svg?sanitize=true" style="max-height:100%;" height="175">
</p>
___

This action set allows you to organize CI/CD with GitHub Actions and [werf](https://github.com/werf/werf). The set consists of several independent and complex actions:

- [werf/actions/converge](https://github.com/werf/actions/tree/master/converge)
- [werf/actions/dismiss](https://github.com/werf/actions/tree/master/dismiss)
- [werf/actions/build](https://github.com/werf/actions/tree/master/build)
- [werf/actions/run](https://github.com/werf/actions/tree/master/run)
- [werf/actions/cleanup](https://github.com/werf/actions/tree/master/cleanup)

Each action combines all the necessary steps in itself and logic may be divided into environment setup and launching the corresponding command. 

**Ready-to-use GitHub Actions Workflows** for different CI/CD workflows are available [here](https://werf.io/v1.2-alpha/documentation/advanced/ci_cd/github_actions.html#complete-set-of-configurations-for-ready-made-workflows).

> Also, there is another action — [werf/actions/install](https://github.com/werf/actions/tree/master/install). With this action a user can just install werf and use binary within job steps for own purposes

## Versioning

When using actions, select the version corresponding to the `MAJOR.MINOR` version of werf:

```yaml
# run converge with actual werf version for 1.1 alpha channel
- uses: werf/actions/converge@v1.1

# run converge with actual werf version for 1.2 alpha channel
- uses: werf/actions/converge@v1.2
```

## Environment setup in details

### werf binary setup

By default, all actions setup actual werf version for 1.2 alpha channel (more details about channels, werf release cycle and compatibility promise [here](https://werf.io/installation.html#all-changes-in-werf-go-through-all-stability-channels)). 
Using the `channel` input the user can switch the release channel.

> This is recommended approach to be up-to-date and to use actual werf version without changing configurations
  
```yaml
- uses: werf/actions/converge@v1.2
  with:
    channel: alpha
```
  
Withal, it is not necessary to work within release channels, and the user might specify certain werf version with `version` input.

```yaml
- uses: werf/actions/converge@v1.2
  with:
    version: v1.2.9
```

### kubeconfig setup (*optional*)

The _kubeconfig_ may be used for deployment, cleanup, distributed locks and caches. Thus, the configuration should be added before step with the action or passed as base64 encoded data with `kube-config-base64-data` input:

* Prepare _kubeconfig_ (e.g. `cat ~/.kube/config | base64`) and save in GitHub Project Secrets (e.g. with name `KUBE_CONFIG_BASE64_DATA`).
 
* Pass secret with `kube-config-base64-data` input:
 
  ```yaml
  - uses: werf/actions/converge@v1.2
    with:
      kube-config-base64-data: ${{ secrets.KUBE_CONFIG_BASE64_DATA }}
  ```

### werf ci-env

This command performs _docker login_ using `github-token`, sets up predefined variables based on GitHub Workflow context.  
 
The `github-token` input is optional, and the input is there in case you need to use a non-default token.  
By default, an action will use the token provided to your workflow.

## Working with werf options

Any werf option can be defined with environment variables:

```yaml
- uses: werf/actions/converge@v1.2
  env:
    WERF_LOG_VERBOSE: "on"
```

## Working with container registry

### Default container repository

By default, each action performs authorization and generates container repository address in the following format: `ghcr.io/$GITHUB_REPOSITORY/<project-from-werf.yaml>`.

For cleanup action you need [to create personal access token](https://docs.github.com/en/github/authenticating-to-github/keeping-your-account-and-data-secure/creating-a-personal-access-token) with `read:packages` and `delete:packages` scope. It is recommended [to store the token as a secret](https://help.github.com/en/actions/configuring-and-managing-workflows/creating-and-storing-encrypted-secrets).

```yaml
- uses: werf/actions/cleanup@v1.2
  with:
    kube-config-base64-data: ${{ secrets.KUBE_CONFIG_BASE64_DATA }}
  env:
    WERF_REPO_GITHUB_TOKEN: ${{ secrets.WERF_REPO_GITHUB_TOKEN }}
```

### Custom container repository

The user can use an arbitrary container repository specifying the `WERF_REPO` and `WERF_REPO_CONTAINER_REGISTRY` environment variables and perform authorization himself. For instance, steps for GCR:

```yaml
- name: Login to GCR
  uses: docker/login-action@v1
  with:
    registry: gcr.io
    username: _json_key
    password: ${{ secrets.GCR_JSON_KEY }}
    
- uses: werf/actions/converge@v1.2
  env:
    WERF_REPO: "gcr.io/company/app"
    WERF_REPO_CONTAINER_REGISTRY: "gcr"
```

> To learn more about how to work with the different container registries, see the appropriate [article in the werf documentation](https://werf.io/v1.2-alpha/documentation/advanced/supported_container_registries.html)

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
      uses: werf/actions/converge@v1.2
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
      uses: werf/actions/dismiss@v1.2
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
      uses: werf/actions/run@v1.2
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
      uses: werf/actions/cleanup@v1.2
      with:
        kube-config-base64-data: ${{ secrets.KUBE_CONFIG_BASE64_DATA }}
      env:
        WERF_REPO_GITHUB_TOKEN: ${{ secrets.WERF_REPO_GITHUB_TOKEN }}
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
      uses: werf/actions/install@v1.2
    
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
        werf render
        werf converge
      env:
        GITHUB_TOKEN: ${{ github.token }}
        WERF_ENV: production
```

# License

Apache License 2.0, see [LICENSE](LICENSE)
