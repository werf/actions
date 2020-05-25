import * as core from '@actions/core'
import {Manager} from './manager'

async function run(): Promise<void> {
  try {
    const m = new Manager()
    await m.Install()
  } catch (error) {
    core.setFailed(error.message)
  }
}

run()
