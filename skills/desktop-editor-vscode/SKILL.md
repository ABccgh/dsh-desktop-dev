---
name: desktop-editor-vscode
description: 本机编辑器环境约定：VS Code（中文界面，code CLI 已安装）的使用方式、当前无扩展的现状与影响、各技术栈的扩展推荐清单与安装规则。涉及用编辑器打开文件、定位错误、需要语言支持/格式化/调试扩展时加载。
---

# VS Code 编辑器环境

## 1. 环境现状（本机事实）

- VS Code 1.135.0 x64，界面语言：中文。
- `code` 命令已在 PATH 上（`code.cmd`）。
- 已安装扩展仅：`ms-ceintl.vscode-language-pack-zh-hans`（中文语言包）。
- **其他语言/格式化/调试扩展均未安装** —— 不要假设任何扩展可用。

## 2. code CLI 常用用法

| 命令 | 用途 |
| --- | --- |
| `code .` | 在当前目录打开工作区 |
| `code <文件/目录>` | 打开指定文件或目录 |
| `code --goto <文件>:<行>:<列>` | 打开文件并定位到行列（报错定位首选） |
| `code --diff <旧> <新>` | 并排展示文件差异（改动审查用） |
| `code --list-extensions` | 列出已安装扩展 |
| `code --install-extension <id>` | 安装扩展 |
| `code -r <路径>` / `code --reuse-window` | 复用已打开窗口 |

注意：`code` 命令默认会阻塞等待 VS Code 关闭（当打开文件/目录时）；脚本与工具调用中需要返回时，用 `code --reuse-window` 或在后台执行。作为编码 Agent，日常读写代码优先用自己的 read/edit/grep/glob 工具，`code` 主要用于让用户查看与交互。

## 3. 无扩展时的工作方式

- 语法检查、跳转、重构等依赖 LSP 的能力用命令行工具替代：`tsc --noEmit`、`dotnet build`、`cargo check`、`clang`/`g++ -fsyntax-only`、`eslint`/`prettier` 的 CLI。
- 调试用日志、CLI 断言与测试框架代替图形调试器。
- 需要扩展才能高效完成的任务（如 C# 智能提示调试），先在方案中说明并征得用户同意安装。

## 4. 各技术栈推荐扩展（按需安装，不预装）

| 栈 | 推荐扩展 id | 用途 |
| --- | --- | --- |
| .NET / C# | `ms-dotnettools.csdevkit` | C# Dev Kit（IntelliSense、调试、解决方案） |
| C/C++ | `ms-vscode.cpptools` | IntelliSense、调试 |
| Rust | `rust-lang.rust-analyzer` | 补全、跳转、cargo 集成 |
| Web/TS | `dbaeumer.vscode-eslint`、`esbenp.prettier-vscode` | 检查与格式化 |
| Tauri | `tauri-apps.tauri-vscode` | Tauri 配置与命令辅助 |
| Playwright | `ms-playwright.playwright` | E2E 测试运行与调试 |
| Markdown | `yzhang.markdown-all-in-one` | 文档写作（ADR、README） |
| 通用 | `eamodio.gitlens`（可选） | Git 历史与行级追溯 |

## 5. 安装规则

0. **当前阶段（用户已决定）**：保持 VS Code 纯净——不主动提议安装任何扩展；等具体项目立项后，再结合项目技术栈与用户重新评估。
1. 安装前征得用户同意：说明扩展 id、用途、体积影响，用 ask_user_question 让用户选择。
2. 安装用 `code --install-extension <id>`，批量安装写成一条命令一次执行。
3. 装完用 `code --list-extensions` 复核，并把结果记录到项目 MEMORY.md 的「当前状态」。
4. 用户拒绝就不装，改走第 3 节的命令行替代方案。

## 6. 与团队委派配合

委派 UI 工程师、核心工程师时，在任务上下文里注明编辑器现状（无扩展、用 CLI 工具链），避免成员假设 IDE 能力存在。
