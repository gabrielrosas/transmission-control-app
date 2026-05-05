import { IpcMain } from 'electron'

export type OverlaysPutArgs = {
  apiUrl: string
  payload: unknown
}

const SEPARATOR = '─────────────────────────────────────────────────────────────────────────────'
const MAX_BODY_LOG = 2000

function prettyJson(value: unknown): string {
  try {
    return JSON.stringify(value, null, 2)
  } catch {
    return String(value)
  }
}

function truncate(text: string, max = MAX_BODY_LOG): string {
  if (text.length <= max) return text
  return text.slice(0, max) + `\n... [${text.length - max} caracteres truncados]`
}

let callCounter = 0

export function loadIPCOverlays(ipcMain: IpcMain) {
  ipcMain.handle('overlays:put', async (_, { apiUrl, payload }: OverlaysPutArgs) => {
    const id = ++callCounter
    const tag = `[overlays #${id}]`

    console.log(SEPARATOR)
    console.log(`${tag} REQUEST  PUT ${apiUrl}`)
    console.log(`${tag} REQUEST  body:`)
    console.log(prettyJson(payload))

    const requestBody = JSON.stringify(payload)
    let response: Response
    try {
      response = await fetch(apiUrl, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: requestBody
      })
    } catch (err) {
      console.log(`${tag} RESPONSE ✕ network error`)
      console.log(err)
      console.log(SEPARATOR)
      throw err
    }

    const text = await response.text()
    console.log(`${tag} RESPONSE ${response.status} ${response.statusText}`)
    if (text) {
      let parsed: unknown = text
      try {
        parsed = JSON.parse(text)
      } catch {
        // leave as text
      }
      console.log(`${tag} RESPONSE body:`)
      console.log(truncate(typeof parsed === 'string' ? parsed : prettyJson(parsed)))
    } else {
      console.log(`${tag} RESPONSE body: <empty>`)
    }
    console.log(SEPARATOR)

    if (!response.ok) {
      throw new Error(
        `overlays.uno PUT falhou (${response.status}): ${text || response.statusText}`
      )
    }
    if (!text) return null
    try {
      return JSON.parse(text)
    } catch {
      return text
    }
  })
}
