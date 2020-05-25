import * as core from '@actions/core'
import * as exec from '@actions/exec'
import * as cache from '@actions/tool-cache'
import * as path from 'path'
import * as io from '@actions/io'
import * as request from 'superagent'
import * as fs from 'fs'
import {String} from 'typescript-string-operations'
import * as crypto from 'crypto'
import * as tmp from 'tmp'
import * as dotenv from 'dotenv'

const WERF_API_GET_CHANNEL_VERSION_URL_METHOD =
  'https://werf.io/api/getChannelVersionURL'
const WERF_API_GET_VERSION_URL_METHOD = 'https://werf.io/api/getVersionURL'

export class Manager {
  private readonly group: string
  private readonly channel: string
  private readonly version: string
  private readonly os: string
  private readonly arch: string

  private binaryPath: string | undefined

  constructor() {
    this.group = core.getInput('group').trim()
    this.channel = core.getInput('channel').trim()
    this.version = core.getInput('version').trim()

    if (process.platform.toString() === 'win32') {
      this.os = 'windows'
    } else {
      this.os = process.platform.toString()
    }

    this.arch = process.arch
  }

  public async Install(): Promise<void> {
    const actualBinaryUrl = await this._getActualBinaryUrl()

    const cachedPath = cache.find(
      'werf',
      Manager._toolVersionCacheID(actualBinaryUrl)
    )
    if (cachedPath) {
      this.binaryPath = path.join(cachedPath, 'werf')
    } else {
      this.binaryPath = await this._downloadAndCache(actualBinaryUrl)
    }

    const binaryDirPath = path.parse(this.binaryPath).dir
    core.addPath(binaryDirPath)
  }

  public async PerformCIEnv(): Promise<void> {
    const tmpFile = tmp.fileSync()
    const tmpFilePath = tmpFile.name
    await this.Exec(['ci-env', 'github', '--as-env-file', '-o', tmpFilePath])
    dotenv.config({path: tmpFilePath})
    tmpFile.removeCallback()
  }

  public async Exec(
    args: string[],
    options?: exec.ExecOptions | undefined
  ): Promise<void> {
    if (!this.binaryPath) {
      core.setFailed('runtime error: werf binary is not found')
      process.exit(1)
    }

    await exec.exec(this.binaryPath, args, options)
  }

  public async GetOutput(args: string[]): Promise<string> {
    let stdOut = ''
    const options = {
      windowsVerbatimArguments: false,
      listeners: {
        stdout: (data: Buffer) => {
          stdOut += data.toString()
        }
      }
    }

    await this.Exec(args, options)
    return stdOut
  }

  private async _getActualBinaryUrl(): Promise<string> {
    try {
      let url: string
      let query: {}

      if (this.version !== '') {
        url = WERF_API_GET_VERSION_URL_METHOD
        query = {
          version: this.version,
          os: this.os,
          arch: this.arch
        }
      } else {
        url = WERF_API_GET_CHANNEL_VERSION_URL_METHOD
        query = {
          group: this.group,
          channel: this.channel,
          os: this.os,
          arch: this.arch
        }
      }

      const resp = await request.get(url).query(query)

      return resp.body.data.toString()
    } catch (err) {
      if (err.response && err.response.error) {
        let errMessage = err.response.error.message
        if (err.response.text) {
          errMessage = String.Format('{0}\n{1}', errMessage, err.response.text)
        }

        throw Error(errMessage)
      }

      throw Error(err)
    }
  }

  private async _downloadAndCache(binaryUrl: string): Promise<string> {
    const downloadedBinaryPath = await cache.downloadTool(binaryUrl)
    const parsedDownloadedBinaryPath = path.parse(downloadedBinaryPath)
    const cacheDownloadToolDir = parsedDownloadedBinaryPath.dir
    const tmpWerfVersionBinaryPath = path.join(cacheDownloadToolDir, 'werf.tmp')
    const werfVersionDir = path.join(
      cacheDownloadToolDir,
      parsedDownloadedBinaryPath.name
    )
    const werfVersionBinaryPath = path.join(
      werfVersionDir,
      String.Format('werf{0}', parsedDownloadedBinaryPath.ext)
    )

    // werf-x.x.x -> werf.tmp
    // werf.tmp -> werf-x.x.x/werf
    await io.mv(downloadedBinaryPath, tmpWerfVersionBinaryPath)
    await io.mkdirP(werfVersionDir)
    await io.mv(tmpWerfVersionBinaryPath, werfVersionBinaryPath)

    if (this.os !== 'windows') {
      fs.chmodSync(werfVersionBinaryPath, 0o755)
    }

    await cache.cacheDir(
      werfVersionDir,
      'werf',
      Manager._toolVersionCacheID(binaryUrl)
    )

    return werfVersionBinaryPath
  }

  private static _toolVersionCacheID(binaryUrl: string): string {
    const md5sum = crypto.createHash('md5')
    return md5sum.update(binaryUrl).digest('hex').toString()
  }
}
