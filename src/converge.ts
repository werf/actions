import * as core from '@actions/core'
import {PrepareEnvironAndRunWerfCommand} from './common'

async function run(): Promise<void> {
  try {
    // with.env parameter has priority over WERF_ENV environment variable
    const envInput = core.getInput('env').trim()
    if (envInput !== '') {
      process.env.WERF_ENV = envInput
    }
    await PrepareEnvironAndRunWerfCommand(['converge'])
  } catch (error) {
    core.setFailed(error.message)
  }
}

run()
