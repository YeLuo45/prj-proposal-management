#!/usr/bin/env node
// Post-build version injector - appends version globals to index.html
import { readFileSync, writeFileSync } from 'fs'
import { execSync } from 'child_process'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Get version from package.json
const pkg = JSON.parse(readFileSync(path.join(__dirname, '../package.json'), 'utf-8'))
const version = pkg.version

// Get git commit
let gitCommit = 'unknown'
try {
  gitCommit = execSync('git rev-parse --short HEAD', { cwd: path.join(__dirname, '..') }).toString().trim()
} catch (e) {}

// Get build time
const buildTime = new Date().toISOString().replace('T', ' ').slice(0, 19)

// Read index.html
const indexPath = path.join(__dirname, '../dist/index.html')
let html = readFileSync(indexPath, 'utf-8')

// Build the script tag to inject
const scriptTag = `\n  <script>\n    window.__APP_VERSION__ = ${JSON.stringify(version)};\n    window.__BUILD_TIME__ = ${JSON.stringify(buildTime)};\n    window.__GIT_COMMIT__ = ${JSON.stringify(gitCommit)};\n  <\/script>\n`

// Insert before </head> closing tag
const headClose = '</head>'
if (!html.includes(headClose)) {
  console.error('ERROR: Could not find </head> in index.html')
  process.exit(1)
}

html = html.replace(headClose, `  ${scriptTag}${headClose}`)

writeFileSync(indexPath, html)

console.log(`Version info injected:`)
console.log(`  Version:   ${version}`)
console.log(`  Build:     ${buildTime}`)
console.log(`  Commit:    ${gitCommit}`)
