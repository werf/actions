import * as core from '@actions/core'
import {PrepareEnvironAndRunWerfCommand} from './common'
import {String} from 'typescript-string-operations'
import {parseArgsStringToArgv} from 'string-argv'

async function run(): Promise<void> {
  try {
    let args = []

    args.push('run')

    const werfImageName = core.getInput('image')
    if (werfImageName !== '') {
      args.push(werfImageName)
    }

    // legacy
    if (process.env.WERF_DOCKER_OPTIONS) {
      args.push(
        String.Format('--docker-options={0}', process.env.WERF_DOCKER_OPTIONS)
      )
    }

    // legacy
    if (process.env.WERF_DRY_RUN) {
      args.push('--dry-run')
    }

    // legacy
    const commandAndArgs = core.getInput('args')
    if (commandAndArgs !== '') {
      const parsedCommandAndArgs = parseArgsStringToArgv(commandAndArgs)
      args.push('--')
      args = args.concat(parsedCommandAndArgs)
    }

    await PrepareEnvironAndRunWerfCommand(args)
  } catch (error) {
    core.setFailed(error.message)
  }
}

run()
