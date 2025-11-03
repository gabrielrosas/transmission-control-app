import { App, IpcMain } from 'electron'
import { mkdir, writeFile, rm, access, readFile } from 'fs/promises'
import { join } from 'path'

export function loadIPCImageCache(ipcMain: IpcMain, app: App) {
  ipcMain.handle(
    'imageCache:save',
    async (
      _,
      {
        base64,
        folder,
        filename
      }: {
        base64: string
        folder: string
        filename: string
      }
    ) => {
      const dir = join(app.getPath('userData'), 'images', folder)
      await mkdir(dir, { recursive: true })
      const file = join(dir, `${filename}.cache`)

      await writeFile(file, base64)
    }
  )

  ipcMain.handle(
    'imageCache:clear',
    async (
      _,
      {
        folder,
        filename
      }: {
        folder: string
        filename: string
      }
    ) => {
      const dir = join(app.getPath('userData'), 'images', folder, `${filename}.cache`)
      await rm(dir, { recursive: true, force: true })
      return true
    }
  )

  ipcMain.handle('imageCache:clearFolder', async (_, { folder }: { folder: string }) => {
    const dir = join(app.getPath('userData'), 'images', folder)
    await rm(dir, { recursive: true, force: true })
    return true
  })

  ipcMain.handle(
    'imageCache:get',
    async (
      _,
      { folder, filename }: { folder: string; filename: string }
    ): Promise<string | undefined> => {
      const dir = join(app.getPath('userData'), 'images', folder, `${filename}.cache`)

      return access(dir)
        .then(() => {
          return readFile(dir, 'utf8')
        })
        .catch(() => {
          return undefined
        })
    }
  )
}
