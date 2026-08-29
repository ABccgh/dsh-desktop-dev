---
name: desktop-packaging-release
description: Windows 桌面应用的打包、代码签名、安装器（MSIX/NSIS/Inno Setup）、自动更新与 WinGet/商店发布的流程与检查清单。发布准备、CI/CD 配置或构建产物异常时加载。
---

# 打包与发布

发布是安全边界，不是最后一步才考虑的事。**任何发布操作前先加载本技能并逐项执行检查清单。**

## 1. 版本策略

- 语义化版本（x.y.z）用于产品与更新通道；Windows 文件/程序集版本使用四段式（x.y.z.b）并随每次构建递增。
- 预发布走独立更新通道（如 beta），不与稳定通道混用。
- 版本号、渠道、构建哈希记录进发布说明与 MEMORY.md。

## 2. 打包

- Electron：electron-builder（NSIS 安装器）或 electron-forge；asar 打包、移除无用依赖、压缩原生模块。
- Tauri：`tauri build`；确认 WebView2 引导安装器（Bootstrapper）与离线包策略。
- WPF/WinForms：单文件发布（`PublishSingleFile`）或 MSIX；.NET 运行时携带策略明确（自包含 vs 框架依赖）。
- Qt：windeployqt 收集依赖；VC++ 运行库随包分发。
- 产物必须有 SHA-256 校验和记录。

## 3. 安装器

- **NSIS/Inno Setup**：开始菜单/桌面快捷方式、卸载器完整清理（含用户数据询问）、静默安装参数（/S）、UAC 处理。
- **MSIX**：声明能力最小化；需要完全信任（驱动、写 Program Files 任意位置）时用非 Store MSIX 或传统安装器。
- 安装/升级/降级/卸载四路径全部实测；升级不清空用户数据。

## 4. 代码签名

- 至少使用 OV 证书，签名所有 exe/dll/安装器；条件允许用 EV 证书 + 硬件令牌。
- 签名后勿再改动文件（签名失效）；SmartScreen 信誉随签名证书与下载量累积。
- 验证：`signtool verify /pa /all`（PowerShell: `Get-AuthenticodeSignature`）。
- 未签名发布视为阻断项，除非内部测试用途并明确告知用户。

## 5. 自动更新

- Electron：electron-updater（NSIS 增量）；Tauri：内置 updater；MSIX：商店或 App Installer 分发；.NET：ClickOnce 或自定义。
- 更新服务器走 HTTPS；清单签名校验；支持静默更新与回滚。
- 发布新版本前先在更新通道做灰度验证。

## 6. 发布渠道

- WinGet（winget-pkgs manifest）适合广泛分发；Microsoft Store 需要 MSIX/转换。
- 官网直发：下载页 + 校验和 + 签名说明。
- 内部分发：共享目录/内网源 + 版本清单。

## 7. 发布前检查清单

- [ ] 版本号与更新通道正确，变更日志完成
- [ ] 全部产物构建成功且通过测试（见 desktop-qa-verification）
- [ ] 安装/升级/卸载实测通过，用户数据保留
- [ ] exe/dll/安装器全部签名且验证通过
- [ ] SHA-256 校验和已记录
- [ ] 杀软扫描（Defender/常见厂商）无高危误报
- [ ] 回滚方案就绪
- [ ] 发布说明、MEMORY.md 已更新

任一未通过项必须在交付说明中显式报告，不得静默发布。
