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
import * as werf from './werf'
import {ValidateWerfVersion} from './common'

const WERF_TUF_SERVER_URL = 'https://tuf.werf.io'
const CACHE_TOOL_NAME = 'werf'
const CACHE_TOOL_DIR = 'werf-tools'

export class Manager {
  private readonly channel: string
  private readonly version: string
  private readonly os: string
  private readonly arch: string

  private binaryPath: string | undefined

  constructor() {
    this.channel = core.getInput('channel').trim()
    this.version = core.getInput('version').trim()

    if (this.version !== '') {
      ValidateWerfVersion(this.version)
    }

    const platform = process.platform.toString()
    switch (platform) {
      case 'linux':
      case 'darwin':
        this.os = platform
        break
      case 'win32':
        this.os = 'windows'
        break
      default:
        throw new Error(String.Format(`The platform ${platform} not supported`))
    }

    const arch = process.arch
    switch (arch) {
      case 'x64':
        this.arch = 'amd64'
        break
      case 'arm64':
        this.arch = 'arm64'
        break
      default:
        throw new Error(String.Format(`The architecture ${arch} not supported`))
    }
  }

  public async Install(): Promise<void> {
    const actualBinaryUrl = await this._getActualBinaryUrl()

    const binaryName = actualBinaryUrl.substring(
      actualBinaryUrl.lastIndexOf('/') + 1
    )
    const cachedPath = cache.find(
      CACHE_TOOL_NAME,
      Manager._toolVersionCacheID(actualBinaryUrl)
    )
    if (cachedPath) {
      this.binaryPath = path.join(cachedPath, binaryName)
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
    const res = dotenv.config({path: tmpFilePath})
    if (res.parsed) {
      for (const [key, value] of Object.entries(res.parsed)) {
        core.exportVariable(key, value)
      }
    }
    console.log(res.parsed)
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
    if (this.version !== '') {
      const version = this.version.slice('v'.length)
      return this._constructReleaseUrl(version)
    }

    const url = `${WERF_TUF_SERVER_URL}/targets/channels/${werf.MAJOR_MINOR_GROUP}/${this.channel}`
    try {
      const resp = await request
        .get(url)
        .buffer(true)
        .parse(request.parse['application/octet-stream'])
      const version = resp.body.toString().trim()
      return this._constructReleaseUrl(version)
    } catch (err) {
      if (err.response && err.response.error) {
        let errMessage = err.response.error.message
        if (err.response.text) {
          errMessage = String.Format(
            '{0}: {1}\n{2}',
            url,
            errMessage,
            err.response.text
          )
        }

        throw Error(errMessage)
      }

      throw Error(err)
    }
  }

  private _constructReleaseUrl(version: string): string {
    let ext = ''
    if (this.os === 'windows') {
      ext = '.exe'
    }

    return String.Format(
      '{0}/targets/releases/{1}/{2}-{3}/bin/werf{4}',
      WERF_TUF_SERVER_URL,
      version,
      this.os,
      this.arch,
      ext
    )
  }

  private async _downloadAndCache(binaryUrl: string): Promise<string> {
    const binaryName = binaryUrl.substring(binaryUrl.lastIndexOf('/') + 1)
    const downloadedBinaryPath = await cache.downloadTool(binaryUrl)
    const cacheDownloadToolDir = path.dirname(downloadedBinaryPath)
    const tmpWerfVersionBinaryPath = path.join(
      cacheDownloadToolDir,
      `${binaryName}.tmp`
    )
    const werfVersionDir = path.join(cacheDownloadToolDir, CACHE_TOOL_DIR)
    const werfVersionBinaryPath = path.join(werfVersionDir, binaryName)

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
      CACHE_TOOL_NAME,
      Manager._toolVersionCacheID(binaryUrl)
    )

    return werfVersionBinaryPath
  }

  private static _toolVersionCacheID(binaryUrl: string): string {
    const md5sum = crypto.createHash('md5')
    return md5sum
      .update(binaryUrl)
      .digest('hex')
      .toString()
  }
}
