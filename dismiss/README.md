<p align="center">
  <img src="https://github.com/werf/werf/raw/master/docs/images/werf-logo.svg?sanitize=true" style="max-height:100%;" height="175">
</p>
___

The action combines all the necessary steps in itself and logic may be divided into environment setup and launching `werf dismiss`.

## Action in Details

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
 
**Note** that `github-token` is optional in this action, and the input is there in case you need to use a non-default token.

By default, action will use the token provided to your workflow.

## Working with werf options

Any werf option can be defined with environment variables:

```yaml
- uses: werf/actions/converge@v1.2
  with:
    env: production
  env:
    WERF_LOG_VERBOSE: "on"
```

## Inputs

```yaml
channel:
  description: 'The one of the following channel: alpha, beta, ea, stable, rock-solid'
  default: 'alpha'
  required: false
version:
  description: 'The certain version'
  required: false
env:
  description: 'Specific deployment environment'
  required: true
github-token:
  description: 'The GitHub token used to login and to interact with Docker Github Packages'
  default: ${{ github.token }}
  required: false
kube-config-base64-data:
  description: 'Base64 encoded kubeconfig data used for deployment, cleanup and distributed locks'
  required: false
```

## Example

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
