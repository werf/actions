import * as core from '@actions/core'
import {PrepareEnvironAndRunWerfCommand} from './common'

async function run(): Promise<void> {
  try {
    await PrepareEnvironAndRunWerfCommand(['build-and-publish'])
  } catch (error) {
    core.setFailed(error.message)
  }
}

run()
