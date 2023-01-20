import * as core from '@actions/core'
import {Manager} from './manager'
import {ProcessGitHubContext} from './common'

async function run(): Promise<void> {
  try {
    ProcessGitHubContext()
    
    const m = new Manager()
    await m.Install()
  } catch (error) {
    core.setFailed(error.message)
  }
}

run()
