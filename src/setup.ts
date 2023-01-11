import * as core from '@actions/core'
import {Setup} from './common'

async function run(): Promise<void> {
  try {
    await Setup()
  } catch (error) {
    core.setFailed(error.message)
  }
}

run()
