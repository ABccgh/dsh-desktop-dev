# dsh-desktop-dev

> [简体中文](README.md)

A DeepSeek Harness agent preset — **Desktop Dev Team**: a virtual team lead specialized in Windows full-stack desktop software development.

## Capabilities

- **Professional team**: five virtual roles (Architect / UI Engineer / Core Engineer / QA Engineer / Release Engineer) collaborating through subagent / workflow / ralph delegation
- **Stack coverage**: Electron / Tauri + web frontend (TypeScript, React, Vue), .NET native (WPF, WinForms), Qt / C++ native, plus packaging, code signing, MSIX/NSIS installers, auto-update, and WinGet publishing
- **Thinking discipline**: survey → plan → decompose → self-verify workflow; architecture decisions recorded as ADRs
- **Memory optimization**: AGENTS.md / CLAUDE.md / MEMORY.md auto-loading (256KB budget), tuned compaction (larger verbatim tail and longer summaries), four-section project memory convention, cross-session recall

## Install

Copy the preset into the DSH user preset directory, then pick **桌面开发团队** when starting a new session:

```powershell
$dst = Join-Path ($env:DSH_HOME ?? (Join-Path $HOME '.dsh')) '.agent-presets\desktop-dev'
New-Item -ItemType Directory -Path $dst -Force | Out-Null
Copy-Item -Recurse -Force .\* $dst
```

(`??` requires PowerShell 7+; on PowerShell 5.1 join the DSH_HOME path manually.)

## Layout

```
agent.cordis.yml   agent composition (standard preset, enhanced)
preset.yml         display metadata
skills/            skills shipped with the preset
  desktop-team-playbook      team formation & delegation protocol (5 role prompt templates)
  desktop-stack-decisions    stack decision tree & ADR conventions
  desktop-ui-ux              Windows UI/UX acceptance checklist
  desktop-packaging-release  packaging / signing / release gate
  desktop-qa-verification    test strategy & pre-release acceptance
  desktop-editor-vscode      VS Code environment conventions & extension guide
  project-memory             project memory maintenance conventions
scripts/           validation scripts (structural + real mount)
docs/              GitHub Pages site
```

## Validation & CI

Every push runs two validation tiers via GitHub Actions:

| Tier | What it checks |
| --- | --- |
| `validate` | Structure: YAML parsing, unique row ids, skill frontmatter, package resolvability |
| `mount` | **Real mount validation**: boots the full DSH Harness (web profile) and runs `agentPresets.standingKeyFor('desktop-dev')` — the exact mount check a session start performs. All four mount-failure classes (unresolvable package, invalid config, row never activated, root-realm service leak) fail CI. |

Reproduce locally:

```powershell
npm install
npm run validate   # structural validation
npm run mount      # real harness mount validation
```

Docs site (GitHub Pages): <https://abccgh.github.io/dsh-desktop-dev/>
