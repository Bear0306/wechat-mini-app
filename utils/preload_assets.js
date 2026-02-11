// utils/preload_assets.js

const fs = wx.getFileSystemManager()
const ROOT = `${wx.env.USER_DATA_PATH}/cached-assets`

function ensureDir() {
  try {
    fs.accessSync(ROOT)
  } catch {
    fs.mkdirSync(ROOT, true)
  }
}

function fileNameFromUrl(url) {
  return url.split('/').pop()
}

function cacheOne(url) {
  return new Promise(resolve => {
    ensureDir()

    const name = fileNameFromUrl(url)
    const localPath = `${ROOT}/${name}`

    // already cached
    try {
      fs.accessSync(localPath)
      return resolve(localPath)
    } catch {}

    // download
    wx.downloadFile({
      url,
      success(res) {
        if (res.statusCode !== 200) return resolve(url)

        fs.saveFile({
          tempFilePath: res.tempFilePath,
          filePath: localPath,
          success: () => resolve(localPath),
          fail: () => resolve(url)
        })
      },
      fail() {
        resolve(url)
      }
    })
  })
}

export async function preload_assets(assetMap = {}) {
  const app = getApp()
  if (!app.globalData.cached_assets) {
    app.globalData.cached_assets = {}
  }

  for (const key in assetMap) {
    if (app.globalData.cached_assets[key]) continue

    const url = assetMap[key]
    const localPath = await cacheOne(url)

    app.globalData.cached_assets[key] = {
      local: localPath,
      cdn: url
    }
  }

  return app.globalData.cached_assets
}
