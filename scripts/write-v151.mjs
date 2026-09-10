import { readFile, writeFile, mkdir, copyFile } from 'node:fs/promises'
import { gunzipSync } from 'node:zlib'

const parts = async (name, count) => {
  let b64 = ''
  for (let i = 1; i <= count; i++) {
    b64 += (await readFile(new URL(`../snapshot-v151/${name}.${i}.b64`, import.meta.url), 'utf8')).trim()
  }
  return gunzipSync(Buffer.from(b64, 'base64')).toString('utf8')
}

await mkdir(new URL('../dist/v151/', import.meta.url), { recursive: true })

let html = await parts('index', 2)
const css = await parts('style', 4)
const js = await parts('app', 4)

// Keep the exact V1.5.1 DOM/CSS/functionality as the rendered app. The only
// HTML changes are a base URL for /p/:slug and a bootstrap that loads the
// matching Supabase-backed Droompot before the original V1.5.1 app.js runs.
html = html.replace('<head>', '<head>\n  <base href="/v151/">')
html = html.replace('<script src="app.js"></script>', '<script src="v151-bootstrap.js"></script>')

await Promise.all([
  writeFile(new URL('../dist/v151/index.html', import.meta.url), html),
  writeFile(new URL('../dist/v151/style.css', import.meta.url), css),
  writeFile(new URL('../dist/v151/app.js', import.meta.url), js),
  copyFile(new URL('../v151-bootstrap.js', import.meta.url), new URL('../dist/v151/v151-bootstrap.js', import.meta.url)),
  copyFile(new URL('../droompot-pig.png', import.meta.url), new URL('../dist/v151/droompot-pig.png', import.meta.url)),
  copyFile(new URL('../noi.jpg', import.meta.url), new URL('../dist/v151/noi.jpg', import.meta.url)),
  copyFile(new URL('../robin.jpg', import.meta.url), new URL('../dist/v151/robin.jpg', import.meta.url)),
])

console.log('Exact V1.5.1 public app written to dist/v151')
