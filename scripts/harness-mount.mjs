// Full harness mount validation for the desktop-dev preset.
//
// Boots the real DeepSeek Harness web profile (the same host composition a
// real session runs), copies this repository into a fresh DSH_HOME as the
// user-authored preset `desktop-dev`, and calls `agentPresets.standingKeyFor`
// — the exact mount check a session start performs. Exits 0 only when the
// preset mounts cleanly; any of the four mount failures (unresolvable package,
// invalid config, row never activated, root-realm service leak) exits 1.
//
// CI usage:  npm install && node scripts/harness-mount.mjs
// Local use: PRESET_ROOT=<preset dir> node scripts/harness-mount.mjs
//            (requires @deepseek-ai/dsh resolvable from node_modules)
import { cpSync, mkdtempSync, mkdirSync, writeFileSync, existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve, dirname } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const repoRoot = process.env.PRESET_ROOT
  ? resolve(process.env.PRESET_ROOT)
  : resolve(dirname(fileURLToPath(import.meta.url)), '..')

const scriptDir = dirname(fileURLToPath(import.meta.url))
const dshPkg = [
  resolve('node_modules/@deepseek-ai/dsh/package.json'),
  resolve(repoRoot, 'node_modules/@deepseek-ai/dsh/package.json'),
  resolve(scriptDir, '../node_modules/@deepseek-ai/dsh/package.json'),
].find((path) => existsSync(path))
if (dshPkg === undefined) {
  console.error('error: @deepseek-ai/dsh is not installed — run `npm install` first')
  process.exit(2)
}

// Fresh, isolated DSH_HOME with this repo mounted as the user preset.
const home = mkdtempSync(join(tmpdir(), 'dsh-ci-home-'))
process.env.DSH_HOME = home
process.env.DSH_TELEMETRY_DISABLED = '1'
mkdirSync(join(home, '.agent-presets', 'desktop-dev'), { recursive: true })
cpSync(join(repoRoot, 'agent.cordis.yml'), join(home, '.agent-presets', 'desktop-dev', 'agent.cordis.yml'))
cpSync(join(repoRoot, 'preset.yml'), join(home, '.agent-presets', 'desktop-dev', 'preset.yml'))
if (existsSync(join(repoRoot, 'skills'))) {
  cpSync(join(repoRoot, 'skills'), join(home, '.agent-presets', 'desktop-dev', 'skills'), { recursive: true })
}

const { boot, composeEntries, healProfilesModuleFallback, loadProfile, loadOptionalPatches } = await import('@deepseek-ai/dsh-app-boot')
const { provideCmdline } = await import('@deepseek-ai/dsh-cmdline')

// Same boot stack as `dsh --profile web`: bundle layers, (empty) profile and
// home user layers, plus the shipped-preset root overlay.
healProfilesModuleFallback(dshPkg)
const profile = loadProfile('dsh', 'web', dshPkg, void 0, { userLayer: false })
writeFileSync(join(profile.dir, 'cordis.yml'), '[]\n')

const bundlePatches = profile.layers.flatMap((layer) => layer.patches)
const profilePatches = []
const homePatches = loadOptionalPatches('dsh', join(home, 'cordis.patch.yml')) ?? []
const overlays = []
const rows = new Map()
for (const row of composeEntries([bundlePatches, profilePatches, homePatches, overlays])) {
  if (typeof row.id === 'string') rows.set(row.id, row)
}
if (rows.has('agent-presets')) {
  const shippedRoot = fileURLToPath(new URL('../config/agent-presets/', pathToFileURL(dshPkg)))
  overlays.push({
    id: 'agent-presets',
    config: {
      ...(rows.get('agent-presets')?.config ?? {}),
      roots: [{ path: shippedRoot, trust: 'system' }],
    },
  })
}

const ctx = await boot(
  'dsh',
  join(profile.dir, 'cordis.yml'),
  structuredClone([...bundlePatches, ...profilePatches, ...homePatches, ...overlays]),
  (hostCtx) => {
    provideCmdline(hostCtx, { args: ['--no-open', '--port', '0'], exit: () => {} })
  },
)

try {
  const presets = ctx.agentPresets
  if (presets === undefined) throw new Error('agentPresets service not found on the booted root context')
  await presets.standingKeyFor('desktop-dev')
  console.log('HARNESS MOUNT VALIDATION: OK — desktop-dev mounts cleanly')
} finally {
  await ctx.fiber.dispose().catch(() => {})
}
