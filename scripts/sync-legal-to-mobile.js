#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * sync-legal-to-mobile.js
 *
 * Copies every public MDX file from /legal-content into /assets/legal as
 * stripped-frontmatter .md, so the mobile app can require() them as strings.
 *
 * Run from the repo root:  node scripts/sync-legal-to-mobile.js
 */
const fs = require('node:fs')
const path = require('node:path')

const REPO_ROOT = path.resolve(__dirname, '..')
const SRC_DIR = path.join(REPO_ROOT, 'legal-content')
const DEST_DIR = path.join(REPO_ROOT, 'assets', 'legal')
// Internal-only docs that must NOT ship to the mobile app.
const EXCLUDE = new Set(['transaction-flow-memo.mdx'])

function stripFrontmatter(raw) {
  if (!raw.startsWith('---')) return raw
  const end = raw.indexOf('\n---', 3)
  if (end === -1) return raw
  return raw.slice(end + 4).replace(/^\s+/, '')
}

if (!fs.existsSync(SRC_DIR)) {
  console.error(`Source directory not found: ${SRC_DIR}`)
  process.exit(1)
}
fs.mkdirSync(DEST_DIR, { recursive: true })

const files = fs.readdirSync(SRC_DIR).filter((f) => f.endsWith('.mdx'))
let copied = 0
for (const f of files) {
  if (EXCLUDE.has(f)) {
    console.log(`✗ skipped (internal): ${f}`)
    continue
  }
  const raw = fs.readFileSync(path.join(SRC_DIR, f), 'utf8')
  const body = stripFrontmatter(raw)
  const out = path.join(DEST_DIR, f.replace(/\.mdx$/, '.md'))
  fs.writeFileSync(out, body, 'utf8')
  copied++
  console.log(`✓ ${f} → assets/legal/${path.basename(out)}`)
}
console.log(`\nDone — synced ${copied}/${files.length} files.`)
