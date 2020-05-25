import * as core from '@actions/core'
import {Manager} from './manager'
import {
  ProcessGitHubContext,
  SetupKubeConfig,
  ValidateWerfVersion
} from './common'

async function run(): Promise<void> {
  try {
    ProcessGitHubContext()

    const kubeConfigBase64Data = core.getInput('kube-config-base64-data')
    if (kubeConfigBase64Data !== '') {
      SetupKubeConfig(kubeConfigBase64Data)
    }

    const m = new Manager()
    await m.Install()

    const versionOutput = await m.GetOutput(['version'])
    ValidateWerfVersion(versionOutput)

    process.env.GITHUB_TOKEN = core.getInput('github-token')
    await m.PerformCIEnv()

    await m.Exec(['cleanup'])
  } catch (error) {
    core.setFailed(error.message)
  }
}

run()
