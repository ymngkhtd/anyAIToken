# AnyAIToken (ais) 🚀 [English](./README.md)

**AnyAIToken** 是一个轻量级、安全且统一的 CLI 包装器，旨在无缝管理和切换多个 AI 服务商（Gemini, OpenAI, Claude 等）的配置与 Token。

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D%2018.0.0-brightgreen)](https://nodejs.org/)

---

## ✨ 核心特性

- 🔒 **本地安全**: 所有敏感的 API Key 在存入本地 SQLite 数据库前均经过 **AES-256-GCM** 加密。
- 🌐 **Web 管理界面**: 基于 React 开发的现代仪表盘，可视化管理你的所有 Profile。
- 🧩 **多 Provider 支持**: 支持将多个环境变量（如 Gemini + OpenAI）组合进一个逻辑 “Profile” 中。
- 🌟 **全局默认 Profile**: 设置默认配置后，无需每次指定 Profile 名称即可直接运行命令。
- 🔄 **导入/导出**: 支持轻松备份或迁移加密的 Profile 配置。
- ⚡ **自动化钩子 (Hooks)**: 为特定工具（如 GPT-Codex CLI）自动生成所需的配置文件。
- 📦 **零配置部署**: 无需外部数据库，采用单文件 SQLite 存储。

---

## 🚀 快速上手

### 安装

```bash
git clone https://github.com/your-username/anyAIToken.git
npm install

cd web
npm install
npm run build

npm link # Optional: makes 'ais' command available globally
```

### 使用方法

1. **启动管理后台**:
   ```bash
   ais ui
   ```
   访问 `http://localhost:3000` 创建你的第一个 Profile。

2. **使用 Profile 运行命令**:
   ```bash
   # 语法: ais run <profile_name> -- <command>
   ais run personal-claude -- claude
   ```
   
3. **设置默认 Profile (推荐)**:
   ```bash
   ais default personal-claude
   # 之后可以直接运行，自动应用默认 Profile:
   ais run -- claude
   ```

---

## 🛠 命令参考

| 命令 | 描述 |
| :--- | :--- |
| `ais ui` | 启动 Web 管理界面 |
| `ais list` | 在终端列出所有可用 Profile |
| `ais default <name>` | 设置全局默认 Profile |
| `ais run [name] -- <cmd>` | 注入 Profile 环境变量并执行命令 |
| `ais rm <name>` | 删除一个 Profile |

---

## 🔌 自动化钩子 (示例: OpenAI/Codex)

当 Profile 包含 `openai` 类型的 Provider 时，`ais` 会自动：
1. 备份你现有的 `~/.codex/config.toml` 和 `auth.json`。
2. 根据你的 Profile 设置生成优化的配置文件。
3. 在命令执行结束后自动恢复你的原始配置。

---

## 🤝 参与贡献

我们欢迎任何形式的贡献！无论是报告 Bug、建议新功能还是提交 Pull Request，你的帮助对我们都很重要。

1. Fork 本项目
2. 创建你的特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交你的改动 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到该分支 (`git push origin feature/AmazingFeature`)
5. 开启一个 Pull Request

---

## 📜 许可证

基于 MIT 许可证开源。请查阅 `LICENSE` 文件了解更多信息。

---

