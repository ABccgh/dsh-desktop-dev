# dsh-desktop-dev

> [English](README.en.md)

DeepSeek Harness 智能体预设 —— **桌面开发团队**：专门用于 Windows 全栈桌面软件开发的虚拟团队 Lead。

## 能力

- **专业团队**：架构师 / UI 工程师 / 核心工程师 / 测试工程师 / 发布工程师五个虚拟角色，通过 subagent / workflow / ralph 委派协作
- **技术栈覆盖**：Electron / Tauri + Web 前端（TypeScript、React、Vue）、.NET 原生（WPF、WinForms）、Qt / C++ 原生，以及打包、签名、MSIX/NSIS、自动更新、WinGet 发布
- **思考优化**：先勘察 → 规划 → 分解 → 自检验收的思考纪律；架构决策写入 ADR
- **记忆优化**：AGENTS.md / CLAUDE.md / MEMORY.md 自动加载（256KB 预算）、压缩策略调优（保留更多最近原文与更长摘要）、项目记忆四段式规范、跨会话召回

## 安装

复制到 DSH 用户预设目录后，新建会话时选择「桌面开发团队」：

```powershell
$dst = Join-Path ($env:DSH_HOME ?? (Join-Path $HOME '.dsh')) '.agent-presets\desktop-dev'
New-Item -ItemType Directory -Path $dst -Force | Out-Null
Copy-Item -Recurse -Force .\* $dst
```

（`??` 需要 PowerShell 7+；PowerShell 5.1 请手动拼接 DSH_HOME 路径。）

## 目录结构

```
agent.cordis.yml   智能体组成（以 standard 为底增强）
preset.yml         显示元数据
skills/            随预设分发的技能
  desktop-team-playbook      团队组建与委派协议（5 角色提示词模板）
  desktop-stack-decisions    技术选型决策树与 ADR 规范
  desktop-ui-ux              Windows UI/UX 验收清单
  desktop-packaging-release  打包 / 签名 / 发布门禁
  desktop-qa-verification    测试策略与发布前验收
  desktop-editor-vscode      VS Code 环境约定与扩展推荐
  project-memory             项目记忆维护规范
scripts/           校验脚本（结构校验 + 真实挂载校验）
docs/              GitHub Pages 站点
```

## 校验与 CI

每次推送都会通过 GitHub Actions 跑两级校验：

| 校验 | 内容 |
| --- | --- |
| `validate` | 结构校验：YAML 解析、行 id 唯一性、技能 frontmatter、包可解析性 |
| `mount` | **真实挂载校验**：启动完整 DSH Harness（web profile），用 `agentPresets.standingKeyFor('desktop-dev')` 做与会话启动完全一致的挂载检查，四类挂载失败（包无法解析 / 配置非法 / 行未激活 / 根域服务泄漏）都会使 CI 失败 |

本地复现：

```powershell
npm install
npm run validate   # 结构校验
npm run mount      # 真实挂载校验
```

文档站（GitHub Pages）：<https://abccgh.github.io/dsh-desktop-dev/>
