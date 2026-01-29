// utils/use_assets.js

export function use_asset(key) {
  const app = getApp()
  const item = app.globalData.cached_assets?.[key]

  if (!item) return null
  return item.local || item.cdn
}

export function use_assets(keys = []) {
  const result = {}
  keys.forEach(k => {
    result[k] = use_asset(k)
  })
  return result
}
