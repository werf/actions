<p align="center">
  <img src="https://github.com/werf/werf/raw/master/docs/images/werf-logo.svg?sanitize=true" style="max-height:100%;" height="175">
</p>
___

The action combines all the necessary steps in itself and logic may be divided into environment setup and launching `werf run`.

## Inputs

```yaml
inputs:
  channel:
    description: 'The one of the following channel: alpha, beta, ea, stable, rock-solid'
    default: 'alpha'
    required: false
  version:
    description: 'The certain version'
    required: false
  image:
    description: 'The image name from werf.yaml (werf run [options] [IMAGE_NAME] [-- COMMAND ARG...])'
    required: false
  args:
    description: 'The specific command with arguments (werf run [options] [IMAGE_NAME] [-- COMMAND ARG...])'
    required: false
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
