export function buildCurrentPath() {
  const pages = getCurrentPages();
  const cur = pages[pages.length - 1];
  const route = `/${cur.route}`;          // e.g. /pages/detail/detail
  const opts  = cur.options || {};
  const qs = Object.keys(opts)
    .map(k => `${encodeURIComponent(k)}=${encodeURIComponent(opts[k])}`)
    .join('&');
  return qs ? `${route}?${qs}` : route;
}

export function buildCurrentQuery() {
  const pages = getCurrentPages();
  const cur = pages[pages.length - 1];
  const opts = cur?.options || {};
  return Object.keys(opts)
    .map(k => `${encodeURIComponent(k)}=${encodeURIComponent(opts[k])}`)
    .join('&');
}