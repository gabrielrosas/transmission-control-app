/// <reference types="node" />
import MD5 from 'crypto-js/md5'

// Options we carry for digest auth and base URL construction
export type PTZRequestOptions = {
  username: string
  password: string
  host: string // e.g. 10.0.0.2 or cam.local (no protocol)
  /**
   * NOTE: Node's built-in fetch does not directly expose an option to ignore TLS.
   * If you need to skip certificate verification for self-signed certs, consider
   * setting NODE_TLS_REJECT_UNAUTHORIZED=0 for the process or use Undici's Agent
   * with a custom dispatcher. This flag is preserved for compatibility only.
   */
  rejectUnauthorized?: boolean
}

export interface AxisCtorOptions {
  camera?: number
  rejectUnauthorized?: boolean // kept for compatibility (see note above)
}

export default class Axis {
  public readonly host: string
  public readonly username: string
  public readonly password: string
  public readonly camera: number
  public readonly options: PTZRequestOptions
  public readonly ptz: PTZ
  public readonly image: Image

  constructor(host: string, username: string, password: string, options: AxisCtorOptions = {}) {
    this.host = host
    this.username = username
    this.password = password

    this.camera = options.camera ?? 1

    this.options = {
      host: this.host,
      username: this.username,
      password: this.password,
      rejectUnauthorized: options.rejectUnauthorized ?? false
    } as PTZRequestOptions

    this.ptz = new PTZ(this.options, this.camera)
    this.image = new Image(this.options, this.camera)
  }
}

class PTZ {
  private readonly options: PTZRequestOptions
  private readonly camera: number

  constructor(options: PTZRequestOptions, camera: number) {
    this.options = options
    this.camera = camera
  }

  async pan(angle: number): Promise<boolean> {
    const cmd = `/axis-cgi/com/ptz.cgi?pan=${angle}&camera=${this.camera}`
    return requestPTZ(cmd, this.options)
  }

  async tilt(angle: number): Promise<boolean> {
    const cmd = `/axis-cgi/com/ptz.cgi?tilt=${angle}&camera=${this.camera}`
    return requestPTZ(cmd, this.options)
  }

  async move(
    pos:
      | 'home'
      | 'up'
      | 'down'
      | 'left'
      | 'right'
      | 'upleft'
      | 'upright'
      | 'downleft'
      | 'downright'
      | 'stop'
  ): Promise<boolean> {
    const cmd = `/axis-cgi/com/ptz.cgi?move=${pos}&camera=${this.camera}`
    return requestPTZ(cmd, this.options)
  }

  async zoom(steps: number): Promise<boolean> {
    const cmd = `/axis-cgi/com/ptz.cgi?zoom=${steps}&camera=${this.camera}`
    return requestPTZ(cmd, this.options)
  }

  async focus(steps: number): Promise<boolean> {
    const cmd = `/axis-cgi/com/ptz.cgi?focus=${steps}&camera=${this.camera}`
    return requestPTZ(cmd, this.options)
  }

  async iris(steps: number): Promise<boolean> {
    const cmd = `/axis-cgi/com/ptz.cgi?iris=${steps}&camera=${this.camera}`
    return requestPTZ(cmd, this.options)
  }

  async brightness(steps: number): Promise<boolean> {
    const cmd = `/axis-cgi/com/ptz.cgi?brightness=${steps}&camera=${this.camera}`
    return requestPTZ(cmd, this.options)
  }

  async rpan(angle: number): Promise<boolean> {
    const cmd = `/axis-cgi/com/ptz.cgi?rpan=${angle}&camera=${this.camera}`
    return requestPTZ(cmd, this.options)
  }

  async rtilt(angle: number): Promise<boolean> {
    const cmd = `/axis-cgi/com/ptz.cgi?rtilt=${angle}&camera=${this.camera}`
    return requestPTZ(cmd, this.options)
  }

  async rzoom(steps: number): Promise<boolean> {
    const cmd = `/axis-cgi/com/ptz.cgi?rzoom=${steps}&camera=${this.camera}`
    return requestPTZ(cmd, this.options)
  }

  async rfocus(steps: number): Promise<boolean> {
    const cmd = `/axis-cgi/com/ptz.cgi?rfocus=${steps}&camera=${this.camera}`
    return requestPTZ(cmd, this.options)
  }

  async riris(steps: number): Promise<boolean> {
    const cmd = `/axis-cgi/com/ptz.cgi?riris=${steps}&camera=${this.camera}`
    return requestPTZ(cmd, this.options)
  }

  async rbrightness(steps: number): Promise<boolean> {
    const cmd = `/axis-cgi/com/ptz.cgi?rbrightness=${steps}&camera=${this.camera}`
    return requestPTZ(cmd, this.options)
  }

  async autofocus(state: boolean): Promise<boolean> {
    const cmd = `/axis-cgi/com/ptz.cgi?autofocus=${state ? 'on' : 'off'}&camera=${this.camera}`
    return requestPTZ(cmd, this.options)
  }

  async autoiris(state: boolean): Promise<boolean> {
    const cmd = `/axis-cgi/com/ptz.cgi?autoiris=${state ? 'on' : 'off'}&camera=${this.camera}`
    return requestPTZ(cmd, this.options)
  }

  async continuouspantiltmove(panSpeed: number, tiltSpeed: number): Promise<boolean> {
    const cmd = `/axis-cgi/com/ptz.cgi?continuouspantiltmove=${panSpeed},${tiltSpeed}&camera=${this.camera}`
    return requestPTZ(cmd, this.options)
  }

  async continuouszoommove(move: number): Promise<boolean> {
    const cmd = `/axis-cgi/com/ptz.cgi?continuouszoommove=${move}&camera=${this.camera}`
    return requestPTZ(cmd, this.options)
  }

  async continuousfocusmove(move: number): Promise<boolean> {
    const cmd = `/axis-cgi/com/ptz.cgi?continuousfocusmove=${move}&camera=${this.camera}`
    return requestPTZ(cmd, this.options)
  }

  async continuousirismove(move: number): Promise<boolean> {
    const cmd = `/axis-cgi/com/ptz.cgi?continuousirismove=${move}&camera=${this.camera}`
    return requestPTZ(cmd, this.options)
  }

  async continuousbrightnessmove(move: number): Promise<boolean> {
    const cmd = `/axis-cgi/com/ptz.cgi?continuousbrightnessmove=${move}&camera=${this.camera}`
    return requestPTZ(cmd, this.options)
  }

  async gotoserverpresetname(presetname: string): Promise<boolean> {
    const cmd = `/axis-cgi/com/ptz.cgi?gotoserverpresetname=${presetname}&camera=${this.camera}`
    return requestPTZ(cmd, this.options)
  }

  async gotoserverpresetno(presetno: number): Promise<boolean> {
    const cmd = `/axis-cgi/com/ptz.cgi?gotoserverpresetno=${presetno}&camera=${this.camera}`
    return requestPTZ(cmd, this.options)
  }

  async gotodevicepreset(presetno: number): Promise<boolean> {
    const cmd = `/axis-cgi/com/ptz.cgi?gotodevicepreset=${presetno}&camera=${this.camera}`
    return requestPTZ(cmd, this.options)
  }

  async speed(speed: number): Promise<boolean> {
    const cmd = `/axis-cgi/com/ptz.cgi?speed=${speed}&camera=${this.camera}`
    return requestPTZ(cmd, this.options)
  }

  async ircutfilter(state: 'on' | 'off' | 'auto'): Promise<boolean> {
    const cmd = `/axis-cgi/com/ptz.cgi?ircutfilter=${state}&camera=${this.camera}`
    return requestPTZ(cmd, this.options)
  }

  async backlight(state: boolean): Promise<boolean> {
    const cmd = `/axis-cgi/com/ptz.cgi?backlight=${state ? 'on' : 'off'}&camera=${this.camera}`
    return requestPTZ(cmd, this.options)
  }

  async query(
    q: 'limits' | 'mode' | 'position' | 'presetposall' | 'presetposcam' | 'speed'
  ): Promise<string | false> {
    const cmd = `/axis-cgi/com/ptz.cgi?query=${q}&camera=${this.camera}`
    return request(cmd, this.options)
  }

  async info(): Promise<string | false> {
    const cmd = `/axis-cgi/com/ptz.cgi?info=1&camera=${this.camera}`
    return request(cmd, this.options)
  }

  async setserverpresetname(presetname: string): Promise<boolean> {
    const cmd = `/axis-cgi/com/ptz.cgi?setserverpresetname=${presetname}&camera=${this.camera}`
    return requestPTZ(cmd, this.options)
  }

  async setserverpresetno(presetno: number): Promise<boolean> {
    const cmd = `/axis-cgi/com/ptz.cgi?setserverpresetno=${presetno}&camera=${this.camera}`
    return requestPTZ(cmd, this.options)
  }

  async removeserverpresetname(presetname: string): Promise<boolean> {
    const cmd = `/axis-cgi/com/ptz.cgi?removeserverpresetname=${presetname}&camera=${this.camera}`
    return requestPTZ(cmd, this.options)
  }

  async removeserverpresetno(presetno: number): Promise<boolean> {
    const cmd = `/axis-cgi/com/ptz.cgi?removeserverpresetno=${presetno}&camera=${this.camera}`
    return requestPTZ(cmd, this.options)
  }

  async center(x: number, y: number): Promise<boolean> {
    const cmd = `/axis-cgi/com/ptz.cgi?center=${x},${y}&camera=${this.camera}`
    return requestPTZ(cmd, this.options)
  }

  async areazoom(x: number, y: number, z: number): Promise<boolean> {
    const cmd = `/axis-cgi/com/ptz.cgi?areazoom=${x},${y},${z}&camera=${this.camera}`
    return requestPTZ(cmd, this.options)
  }

  async movePrediction(): Promise<string | false> {
    const cmd = '/axis-cgi/param.cgi?action=update&PTZ.UserAdv.MovePrediction'
    return request(cmd, this.options)
  }

  async reachPos(): Promise<boolean> {
    const posOld = await this.query('position')
    let posNew: string | false = null as unknown as string
    // eslint-disable-next-line no-constant-condition
    while (true) {
      posNew = await this.query('position')
      if (posOld === posNew) {
        return true
      }
    }
  }
}

class Image {
  private readonly options: PTZRequestOptions
  private readonly camera: number

  constructor(options: PTZRequestOptions, camera: number) {
    this.options = options
    this.camera = camera
  }

  async snapshotJPEG(
    opts: Record<string, string | number | boolean> = {}
  ): Promise<Buffer | false> {
    let cmd = `/axis-cgi/jpg/image.cgi?camera=${this.camera}`
    Object.keys(opts).forEach((k) => {
      const v = opts[k]
      cmd += `&${k}=${String(v)}`
    })

    const raw = await requestBinary(cmd, this.options)
    if (raw === false) return false
    return Buffer.from(raw)
  }
}

// ---------------------
// Low-level HTTP helpers with Digest Auth handling (using fetch)
// ---------------------

type DigestParams = {
  username: string
  realm: string
  nonce: string
  uri: string
  qop: string
  response: string
  nc: string
  cnonce: string
}

let lastDigestParams: DigestParams | null = null
let lastHA1: string | null = null

function buildUrl(host: string, cmd: string): string {
  const needsProto = !host.startsWith('http://') && !host.startsWith('https://')
  const base = needsProto ? `https://${host}` : host
  return base + cmd
}

async function requestPTZ(cmd: string, options: PTZRequestOptions): Promise<boolean> {
  const url = buildUrl(options.host, cmd)

  // 1) Send without auth to get the challenge
  const res = await fetch(url)
  const authHeader = res.headers.get('www-authenticate')
  if (authHeader) {
    const challengeParams = parseDigest(authHeader)
    lastHA1 = MD5(`${options.username}:${challengeParams.realm}:${options.password}`).toString()
    const ha2 = MD5(`GET:${new URL(url).pathname + new URL(url).search}`).toString()
    const response = MD5(`${lastHA1}:${challengeParams.nonce}:1::auth:${ha2}`).toString()

    const nextParams: DigestParams = {
      username: options.username,
      realm: challengeParams.realm,
      nonce: challengeParams.nonce,
      uri: new URL(url).pathname + new URL(url).search,
      qop: challengeParams.qop,
      response,
      nc: '1',
      cnonce: ''
    }
    lastDigestParams = nextParams

    const res2 = await fetch(url, {
      headers: { Authorization: renderDigest(nextParams) }
    })
    return res2.status === 204
  } else {
    if (!lastDigestParams || !lastHA1) return false
    const ha2 = MD5(`GET:${new URL(url).pathname + new URL(url).search}`).toString()
    lastDigestParams.response = MD5(
      `${lastHA1}:${lastDigestParams.nonce}:1::auth:${ha2}`
    ).toString()
    lastDigestParams.uri = new URL(url).pathname + new URL(url).search
    const res2 = await fetch(url, {
      headers: { Authorization: renderDigest(lastDigestParams) }
    })
    return res2.status === 204
  }
}

async function request(cmd: string, options: PTZRequestOptions): Promise<string | false> {
  const url = buildUrl(options.host, cmd)

  const res = await fetch(url)
  const authHeader = res.headers.get('www-authenticate')
  if (authHeader) {
    const challengeParams = parseDigest(authHeader)
    lastHA1 = MD5(`${options.username}:${challengeParams.realm}:${options.password}`).toString()
    const ha2 = MD5(`GET:${new URL(url).pathname + new URL(url).search}`).toString()
    const response = MD5(`${lastHA1}:${challengeParams.nonce}:1::auth:${ha2}`).toString()

    const nextParams: DigestParams = {
      username: options.username,
      realm: challengeParams.realm,
      nonce: challengeParams.nonce,
      uri: new URL(url).pathname + new URL(url).search,
      qop: challengeParams.qop,
      response,
      nc: '1',
      cnonce: ''
    }
    lastDigestParams = nextParams

    const res2 = await fetch(url, {
      headers: { Authorization: renderDigest(nextParams) }
    })
    if (res2.status === 204) return ''
    return await res2.text()
  } else {
    if (!lastDigestParams || !lastHA1) return false
    const ha2 = MD5(`GET:${new URL(url).pathname + new URL(url).search}`).toString()
    lastDigestParams.response = MD5(
      `${lastHA1}:${lastDigestParams.nonce}:1::auth:${ha2}`
    ).toString()
    lastDigestParams.uri = new URL(url).pathname + new URL(url).search
    const res2 = await fetch(url, {
      headers: { Authorization: renderDigest(lastDigestParams) }
    })
    return await res2.text()
  }
}

async function requestBinary(cmd: string, options: PTZRequestOptions): Promise<Uint8Array | false> {
  const url = buildUrl(options.host, cmd)

  const res = await fetch(url)
  const authHeader = res.headers.get('www-authenticate')
  if (authHeader) {
    const challengeParams = parseDigest(authHeader)
    lastHA1 = MD5(`${options.username}:${challengeParams.realm}:${options.password}`).toString()
    const ha2 = MD5(`GET:${new URL(url).pathname + new URL(url).search}`).toString()
    const response = MD5(`${lastHA1}:${challengeParams.nonce}:1::auth:${ha2}`).toString()

    const nextParams: DigestParams = {
      username: options.username,
      realm: challengeParams.realm,
      nonce: challengeParams.nonce,
      uri: new URL(url).pathname + new URL(url).search,
      qop: challengeParams.qop,
      response,
      nc: '1',
      cnonce: ''
    }
    lastDigestParams = nextParams

    const res2 = await fetch(url, {
      headers: { Authorization: renderDigest(nextParams) }
    })
    const buf = new Uint8Array(await res2.arrayBuffer())
    return buf
  } else {
    if (!lastDigestParams || !lastHA1) return false
    const ha2 = MD5(`GET:${new URL(url).pathname + new URL(url).search}`).toString()
    lastDigestParams.response = MD5(
      `${lastHA1}:${lastDigestParams.nonce}:1::auth:${ha2}`
    ).toString()
    lastDigestParams.uri = new URL(url).pathname + new URL(url).search
    const res2 = await fetch(url, {
      headers: { Authorization: renderDigest(lastDigestParams) }
    })
    const buf = new Uint8Array(await res2.arrayBuffer())
    return buf
  }
}

function parseDigest(header: string): Record<string, string> {
  const prefix = 'Digest '
  const start = header.indexOf(prefix)
  const challenge = header.substring(start + prefix.length)
  const parts = challenge.split(',')
  const params: Record<string, string> = {}
  for (const part of parts) {
    const m = part.match(/^\s*?([a-zA-Z0-9]+)="(.*)"\s*?$/)
    if (m && m.length > 2) {
      params[m[1]] = m[2]
    }
  }
  return params
}

function renderDigest(params: DigestParams): string {
  const pieces: string[] = []
  for (const k in params) {
    if (Object.prototype.hasOwnProperty.call(params, k)) {
      pieces.push(`${k}="${(params as Record<string, string>)[k]}"`)
    }
  }
  return 'Digest ' + pieces.join(',')
}
