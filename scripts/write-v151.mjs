import { readFile, writeFile, mkdir, copyFile, rm } from 'node:fs/promises'
import { execFileSync } from 'node:child_process'

const archive = new URL('../v2-approved-ui.tar.gz', import.meta.url)
const archiveB64 = new URL('../v2-approved-ui.b64', import.meta.url)
const unpack = new URL('../.v2-approved-ui/', import.meta.url)
const out = new URL('../dist/v151/', import.meta.url)

await rm(unpack, { recursive: true, force: true })
await mkdir(unpack, { recursive: true })
await mkdir(out, { recursive: true })

const encoded = (await readFile(archiveB64, 'utf8')).trim()
await writeFile(archive, Buffer.from(encoded, 'base64'))
execFileSync('tar', ['-xzf', new URL(archive).pathname, '-C', new URL(unpack).pathname])

const approved = new URL('v151/', unpack)
const files = ['index.html','app.js','style.css','theme-fixes.css','v151-bootstrap.js','v151-feedback.js']
await Promise.all(files.map(file => copyFile(new URL(file, approved), new URL(file, out))))
await copyFile(new URL('feedback-round-1.css', unpack), new URL('../dist/feedback-round-1.css', import.meta.url))

// V2 integration only: allow the authenticated /app/:id route to open the
// settings screen inside the exact approved ZIP frontend.
const feedbackFile = new URL('v151-feedback.js', out)
let feedback = await readFile(feedbackFile, 'utf8')
feedback = feedback.replace(
  "if(qs.get('view')==='dream') setTimeout(()=>{try{show('home')}catch{}},0)",
  "if(qs.get('view')==='dream') setTimeout(()=>{try{show('home')}catch{}},0)\n  if(qs.get('view')==='settings') setTimeout(()=>{try{document.getElementById('open-settings')?.click()}catch{}},0)"
)
await writeFile(feedbackFile, feedback)

await Promise.all([
  copyFile(new URL('../droompot-pig.png', import.meta.url), new URL('droompot-pig.png', out)),
  copyFile(new URL('../noi.jpg', import.meta.url), new URL('noi.jpg', out)),
  copyFile(new URL('../robin.jpg', import.meta.url), new URL('robin.jpg', out)),
])

console.log('Exact feedback ZIP UI integrated into V2 dist/v151')
