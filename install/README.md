<p align="center">
  <img src="https://github.com/flant/werf/raw/master/docs/images/werf-logo.svg?sanitize=true" style="max-height:100%;" height="175">
</p>
___
 
By default, all actions setup actual werf version for [1.1 stable channel](https://werf.io/releases.html) (more details about channels, werf release cycle and compatibility promise [here](https://github.com/flant/werf#backward-compatibility-promise)). 
Using `group` and `channel` inputs the user can switch the release channel.

> This is recommended approach to be up-to-date and to use actual werf version without changing configurations
  
```yaml
- uses: flant/werf-actions/install@v1
  with:
    group: 1.1
    channel: alpha
```
  
Withal, it is not necessary to work within release channels, and the user might specify certain werf version with `version` input.

```yaml
- uses: flant/werf-actions/install@v1
  with:
    version: v1.1.16
```

## Inputs

```yaml
group:
  description: 'The MAJOR.MINOR version'
  default: '1.1'
  required: false
channel:
  description: 'The one of the following channel: alpha, beta, ea, stable, rock-solid'
  default: 'stable'
  required: false
version:
  description: 'The certain version'
  required: false
```

## Example

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
