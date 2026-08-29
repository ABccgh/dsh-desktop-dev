// Structural validation for the desktop-dev preset repository.
//
// Checks everything a text inspection can decide without booting the harness:
//   - preset.yml parses and carries name + description;
//   - agent.cordis.yml parses; every row has a unique id and a name; group
//     rows carry a config list; @deepseek-ai/* rows resolve to installed
//     packages (requires `npm install` — this catches "Cannot find package",
//     one of the four mount failures);
//   - every skills/<dir>/SKILL.md carries valid frontmatter whose `name`
//     equals its directory and whose `description` is non-empty;
//   - files are valid UTF-8.
//
// The full runtime mount check (service realms, row activation) lives in
// scripts/harness-mount.mjs and runs in CI as the second job.
import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { join, resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parse } from 'yaml'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const errors = []
const check = (cond, msg) => {
  if (!cond) errors.push(msg)
}
const read = (path) => readFileSync(path, 'utf8')

// ── preset.yml ──────────────────────────────────────────────────────────────
const presetPath = join(root, 'preset.yml')
check(existsSync(presetPath), 'missing preset.yml')
let meta = null
try {
  meta = parse(read(presetPath))
} catch (error) {
  errors.push(`preset.yml does not parse: ${error.message}`)
}
if (meta !== null) {
  check(typeof meta?.name === 'string' && meta.name.trim() !== '', 'preset.yml: `name` must be a non-empty string')
  check(typeof meta?.description === 'string' && meta.description.trim() !== '', 'preset.yml: `description` must be a non-empty string')
}

// ── agent.cordis.yml ────────────────────────────────────────────────────────
const compPath = join(root, 'agent.cordis.yml')
check(existsSync(compPath), 'missing agent.cordis.yml')
let rows = null
try {
  rows = parse(read(compPath))
} catch (error) {
  errors.push(`agent.cordis.yml does not parse: ${error.message}`)
}
if (rows !== null) {
  check(Array.isArray(rows), 'agent.cordis.yml: top level must be a list of rows')
  if (Array.isArray(rows)) {
    const ids = new Set()
    const walk = (list, at) => {
      list.forEach((row, index) => {
        const here = `${at}[${index}]`
        const okObject = row !== null && typeof row === 'object' && !Array.isArray(row)
        check(okObject, `${here}: row must be an object`)
        if (!okObject) return
        check(typeof row.id === 'string' && row.id.trim() !== '', `${here}: row must have a non-empty string id`)
        check(typeof row.name === 'string' && row.name.trim() !== '', `${here}: row must have a non-empty string name`)
        if (typeof row.id === 'string' && row.id !== '') {
          check(!ids.has(row.id), `duplicate row id "${row.id}" at ${here}`)
          ids.add(row.id)
        }
        if (row.disabled !== undefined) check(typeof row.disabled === 'boolean', `${here}: disabled must be a boolean`)
        if (row.name === 'cordis:group') {
          check(row.group === true, `${here}: cordis:group rows must set group: true`)
          check(Array.isArray(row.config), `${here}: cordis:group must carry a config list`)
          if (Array.isArray(row.config)) walk(row.config, `${here}.config`)
        } else if (typeof row.name === 'string' && row.name.startsWith('@deepseek-ai/')) {
          check(existsSync(join(root, 'node_modules', row.name, 'package.json')), `${here}: package ${row.name} is not installed (run npm install; unresolvable packages fail mount)`)
        }
      })
    }
    walk(rows, 'rows')
  }
}

// ── skills ──────────────────────────────────────────────────────────────────
const skillsDir = join(root, 'skills')
check(existsSync(skillsDir), 'missing skills/ directory')
if (existsSync(skillsDir)) {
  const entries = readdirSync(skillsDir, { withFileTypes: true }).filter((e) => e.isDirectory())
  check(entries.length > 0, 'skills/ contains no skill directories')
  for (const entry of entries) {
    const skillFile = join(skillsDir, entry.name, 'SKILL.md')
    check(existsSync(skillFile), `skills/${entry.name}: missing SKILL.md`)
    if (!existsSync(skillFile)) continue
    const text = read(skillFile)
    check(!text.includes('\uFFFD'), `skills/${entry.name}: SKILL.md is not valid UTF-8`)
    const match = /^---\r?\n([\s\S]*?)\r?\n---/.exec(text)
    if (match === null) {
      errors.push(`skills/${entry.name}: SKILL.md must start with a --- frontmatter block`)
      continue
    }
    let fm = null
    try {
      fm = parse(match[1])
    } catch (error) {
      errors.push(`skills/${entry.name}: frontmatter does not parse: ${error.message}`)
      continue
    }
    check(fm?.name === entry.name, `skills/${entry.name}: frontmatter name must equal "${entry.name}"`)
    check(typeof fm?.description === 'string' && fm.description.trim() !== '', `skills/${entry.name}: frontmatter description must be a non-empty string`)
  }
}

// ── UTF-8 ───────────────────────────────────────────────────────────────────
for (const path of [presetPath, compPath]) {
  if (existsSync(path)) check(!read(path).includes('\uFFFD'), `${path}: not valid UTF-8`)
}

if (errors.length > 0) {
  console.error('STRUCTURE VALIDATION FAILED:')
  for (const error of errors) console.error('  - ' + error)
  process.exit(1)
}
console.log('STRUCTURE VALIDATION: OK')
