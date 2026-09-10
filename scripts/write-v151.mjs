import { readFile, writeFile, mkdir, copyFile } from 'node:fs/promises'

const htmlParts = async () => {
  const chunks = []
  for (let i = 1; i <= 4; i++) chunks.push(await readFile(new URL(`../v151-source/index.part${i}.html`, import.meta.url), 'utf8'))
  return chunks.join('')
}

await mkdir(new URL('../dist/v151/', import.meta.url), { recursive: true })
let html = await htmlParts()
const css = await readFile(new URL('../style.css', import.meta.url), 'utf8')
const js = await readFile(new URL('../app.js', import.meta.url), 'utf8')

html = html.replace('<head>', '<head>\n  <base href="/v151/">\n  <link rel="stylesheet" href="theme-fixes.css">')
html = html.replace('<script src="app.js"></script>', '<script src="v151-bootstrap.js"></script>')

await Promise.all([
  writeFile(new URL('../dist/v151/index.html', import.meta.url), html),
  writeFile(new URL('../dist/v151/style.css', import.meta.url), css),
  writeFile(new URL('../dist/v151/app.js', import.meta.url), js),
  copyFile(new URL('../v151-bootstrap.js', import.meta.url), new URL('../dist/v151/v151-bootstrap.js', import.meta.url)),
  copyFile(new URL('../v151-feedback.js', import.meta.url), new URL('../dist/v151/v151-feedback.js', import.meta.url)),
  copyFile(new URL('../src/theme-fixes.css', import.meta.url), new URL('../dist/v151/theme-fixes.css', import.meta.url)),
  copyFile(new URL('../droompot-pig.png', import.meta.url), new URL('../dist/v151/droompot-pig.png', import.meta.url)),
  copyFile(new URL('../noi.jpg', import.meta.url), new URL('../dist/v151/noi.jpg', import.meta.url)),
  copyFile(new URL('../robin.jpg', import.meta.url), new URL('../dist/v151/robin.jpg', import.meta.url)),
])

console.log('Approved v1.5.1-derived UI integrated into V2 dist/v151')
