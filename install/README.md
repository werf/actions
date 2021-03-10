<p align="center">
  <img src="https://github.com/werf/werf/raw/master/docs/images/werf-logo.svg?sanitize=true" style="max-height:100%;" height="175">
</p>
___
 
By default, all actions setup actual werf version for 1.2 alpha channel (more details about channels, werf release cycle and compatibility promise [here](https://werf.io/installation.html#all-changes-in-werf-go-through-all-stability-channels)). 
Using the `channel` input the user can switch the release channel.

> This is recommended approach to be up-to-date and to use actual werf version without changing configurations
  
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

## Inputs

```yaml
channel:
  description: 'The one of the following channel: alpha, beta, ea, stable, rock-solid'
  default: 'alpha'
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
