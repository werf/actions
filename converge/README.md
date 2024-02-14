<p align="center">
  <img src="https://github.com/werf/werf/raw/master/docs/images/werf-logo.svg?sanitize=true" style="max-height:100%;" height="175">
</p>
___

The action combines all the necessary steps in itself and logic may be divided into environment setup and launching `werf converge`.

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
converge: 
  name: Converge
  runs-on: ubuntu-latest
  steps:
  
    - name: Checkout code
      uses: actions/checkout@v4
      with:
        fetch-depth: 0

    - name: Converge
      uses: werf/actions/converge@v1.2
      with:
        kube-config-base64-data: ${{ secrets.KUBE_CONFIG_BASE64_DATA }}
        env: production
```
