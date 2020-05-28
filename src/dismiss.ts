import * as core from '@actions/core'
import {PrepareEnvironAndRunWerfCommand} from './common'

async function run(): Promise<void> {
  try {
    process.env.WERF_ENV = core.getInput('env')
    await PrepareEnvironAndRunWerfCommand(['dismiss'])
  } catch (error) {
    core.setFailed(error.message)
  }
}

run()
