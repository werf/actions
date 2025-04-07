<p align="center">
  <img src="https://werf.io/assets/images/werf-logo.svg?sanitize=true" style="max-height:100%;" height="175">
</p>
___

This action allows you to organize CI/CD with GitHub Actions and [werf](https://github.com/werf/werf).

**Ready-to-use GitHub Actions Workflows** for different CI/CD workflows are available [here](https://werf.io/guides/nodejs/400_ci_cd_workflow/040_github_actions.html).

## How to use

```yaml
converge:
  name: Converge
  runs-on: ubuntu-latest
  steps:

    - name: Checkout code
      uses: actions/checkout@v4
      with:
        fetch-depth: 0
    
    - name: Install werf
      uses: werf/actions/install@v2
      
    - name: Run script
      run: |
        . $(werf ci-env github --as-file) 
        werf converge
      env:
        WERF_KUBECONFIG_BASE64: ${{ secrets.KUBE_CONFIG_BASE64_DATA }}
        WERF_ENV: production
        GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

## Versioning

When using action, select the version corresponding to the required `MAJOR` version of werf.

By default, the action installs actual werf version within alpha channel (more details about channels, werf release cycle and compatibility promise [here](https://werf.io/installation.html#all-changes-in-werf-go-through-all-stability-channels)). 
Using the `channel` input the user can switch the release channel.

> This is recommended approach to be up-to-date and to use actual werf version without changing configurations.
  
```yaml
- uses: werf/actions/install@v2
  with:
    channel: alpha
```
  
Withal, it is not necessary to work within release channels, and the user might specify certain werf version with `version` input.

```yaml
- uses: werf/actions/install@v2
  with:
    version: v2.1.0
```

## FAQ

### werf always rebuilds images on new commit

Make sure to use `fetch-depth: 0` setting in the checkout action, like follows:

```yaml
- name: Checkout code
  uses: actions/checkout@v4
  with:
    fetch-depth: 0
```

By default, fetch-depth set to `1` which disables git history when checking out code. werf cache selection algorithm uses git history to determine whether some image bound to some commit could be used as a cache when building current commit (current commit should be descendant to the cache commit).

Setting `fetch-depth` to `0` enables full fetch of git history, and it is a **recommended** approach. It is also possible to limit fetch history with some decent number of commits, which would enable images caching limited to that number of commits, but this would have a negative impact on cache reproducibility.

### Working with container registry

If there is a need to perform authorization using custom credentials or in an external container registry, then you have to use a ready-made action tailored to your container registry (or just run `werf cr login`).

```yaml
converge:
  name: Converge
  runs-on: ubuntu-latest
  steps:

    - name: Checkout code
      uses: actions/checkout@v4
      with:
        fetch-depth: 0
    
    - name: Install werf
      uses: werf/actions/install@v2
    
    - name: cr login
      run: werf cr login -u ${{ secrets.REGISTRY_USER }} -p ${{ secrets.REGISTRY_TOKEN }} registry.example.com
    
    - name: converge
      run: werf converge
      env:
        WERF_KUBECONFIG_BASE64: ${{ secrets.KUBE_CONFIG_BASE64_DATA }}
        WERF_ENV: production
        WERF_REPO: registry.example.com/repo
```

> Environment variables **`WERF_REPO`** and **`GITHUB_TOKEN`** for converge should only be used if building images is required otherwise they can be omitted 

In the simplest case, if an [integrated GitHub Packages-like container registry](https://help.github.com/en/packages/using-github-packages-with-your-projects-ecosystem/configuring-docker-for-use-with-github-packages) is used, then the authorization is performed automatically when the `werf ci-env` command is invoked. This command is run with several required arguments such as GitHub environment variables, the [`GITHUB_TOKEN` secret](https://help.github.com/en/actions/configuring-and-managing-workflows/authenticating-with-the-github_token#about-the-github_token-secret) (you have to explicitly declare it).

### Using Docker Buildx

To build multi-platform images or customize the build environment, you can use [docker/setup-buildx-action@v3](https://github.com/docker/setup-buildx-action). Below are two usage examples depending on the build driver: default `docker-container` and `docker`.

#### 1. Docker buildx with default `docker-container` driver

This is the default and recommended mode for most CI builds. It runs builds inside a container-based builder instance.

```yaml
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Install werf
        uses: werf/actions/install@v2

      - name: cr login
        run: werf cr login -u ${{ secrets.REGISTRY_USER }} -p ${{ secrets.REGISTRY_TOKEN }} registry.example.com

      - name: converge
        run: |
          . $(werf ci-env github --as-file)
          werf converge
        env:
          WERF_KUBECONFIG_BASE64: ${{ secrets.KUBE_CONFIG_BASE64_DATA }}
          WERF_ENV: production
```

> No additional configuration is required, and QEMU is automatically used for cross-platform builds.

#### 2. Docker buildx with `docker` driver

The `docker` driver runs builds directly on the host using the native Docker engine. This may be useful for compatibility reasons or specific local setups. To enable cross-platform builds with the `docker` driver, QEMU must be manually installed.

```yaml
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Set up QEMU
        uses: docker/setup-qemu-action@v3

      - name: Set up Docker Buildx with docker driver
        uses: docker/setup-buildx-action@v3
        with:
          driver: docker

      - name: Install werf
        uses: werf/actions/install@v2

      - name: cr login
        run: werf cr login -u ${{ secrets.REGISTRY_USER }} -p ${{ secrets.REGISTRY_TOKEN }} registry.example.com

      - name: converge
        run: |
          . $(werf ci-env github --as-file)
          werf converge
        env:
          WERF_KUBECONFIG_BASE64: ${{ secrets.KUBE_CONFIG_BASE64_DATA }}
          WERF_ENV: production
```

> When using the `docker` driver, make sure your Docker daemon supports the target platforms, and QEMU is available if you build for other architectures (e.g., `linux/arm64`).

## License

Apache License 2.0, see [LICENSE](LICENSE)