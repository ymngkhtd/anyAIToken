# AnyAIToken (AI-Switch) 项目架构文档

## 1. 项目概述
本项目旨在开发一个跨平台（Windows, Linux, macOS）的 CLI 工具，用于方便地管理和切换不同大模型工具（Gemini CLI, Codex CLI, Claude Code 等）的 Token 和 API Endpoint 配置。

**核心理念：** 简单、本地化、安全、零依赖（无需安装外部数据库）。

## 2. 技术栈架构 (Tech Stack)

基于 "简单易维护" 的原则，我们放弃了 PostgreSQL，采用轻量级嵌入式方案。

*   **Runtime**: Node.js (TypeScript)
*   **Frontend**: React + Vite + TailwindCSS + Shadcn/UI (用于管理面板)
*   **Backend/CLI**: Node.js + Commander.js (命令行交互) + Cross-Spawn (子进程管理)
*   **Database**: SQLite (通过 `better-sqlite3` 或 `Prisma` 访问) - 单文件存储，无需部署。
*   **Security**: AES-256-GCM 加密 (用于存储 API Keys)

## 3. 系统设计 (System Design)

### 3.1 核心工作流 (Workflow)
系统由两部分组成：**管理服务** 和 **执行包装器 (Wrapper)**。

1.  **配置阶段 (Web UI)**:
    *   用户启动本地服务 (`anyai ui`)。
    *   在 React 界面中创建 "Profile" (例如: `personal-claude`, `work-gemini`)。
    *   输入加密的 API Key 和 Endpoint。
    *   数据存入本地 SQLite `db.sqlite`。

2.  **使用阶段 (CLI Wrapper)**:
    *   用户在终端运行包装命令：
        ```bash
        # 语法: ais run <profile> -- <command>
        ais run personal -- claude code "fix this bug"
        ```
    *   **CLI 解析流程**:
        1.  查找 Profile `personal`。
        2.  读取并解密对应的 Token/URL。
        3.  构建临时的环境变量对象 (`process.env + { ANTHROPIC_API_KEY: ... }`)。
        4.  使用 `spawn` 启动子进程 (`claude code "fix this bug"`)。
        5.  管道传输 (Pipe) 标准输入/输出，保持交互性。

### 3.2 数据库设计 (Schema Draft)

**Profiles 表**
| Field | Type | Description |
| :--- | :--- | :--- |
| id | UUID | 主键 |
| name | String | 唯一标识 (e.g., "personal") |
| provider | String | 预设类型 (gemini, claude, openai, custom) |
| env_vars | JSON | 加密存储的环境变量映射 (e.g., `{"GOOGLE_API_KEY": "enc_..."}`) |
| created_at | DateTime | |

### 3.3 安全策略 (Security)
*   **存储安全**: 所有的 Sensitive Data (API Keys) 在写入数据库前必须经过 AES-256 加密。
*   **密钥管理**:
    *   *方案 A (MVP)*: 依赖本地机器指纹或固定 Salt（防明文泄漏）。
    *   *方案 B (推荐)*: 首次启动要求用户设置一个 Master Password，用于加解密 KeyRing。

## 4. 目录结构 (Directory Structure)

```text
anyAIToken/
├── package.json
├── tsconfig.json
├── GEMINI.md           # 架构文档
├── db/                 # SQLite 数据库文件位置
│   └── data.sqlite
├── packages/
│   ├── core/           # 核心逻辑 (DB, Encryption, Types)
│   ├── cli/            # 命令行入口 (Commander, Wrapper logic)
│   └── web/            # React 前端 (Vite project)
└── scripts/            # 开发脚本
```

## 5. 开发路线图 (Roadmap)

### Phase 1: 核心引擎 (Core Engine)
- [ ] 初始化 Monorepo 或标准 TS 项目结构。
- [ ] 实现 SQLite 连接与 CRUD 操作。
- [ ] 实现 AES 加密/解密模块。
- [ ] 编写测试用例验证数据存取。

### Phase 2: CLI 执行器 (The Wrapper)
- [ ] 实现 `ais run <profile> -- <cmd>` 命令解析。
- [ ] 实现环境变量注入与子进程 Spawn。
- [ ] 验证跨平台兼容性 (特别是 Windows 下的 Path 和 Env 处理)。

### Phase 3: 可视化管理 (Web UI)
- [ ] 搭建 Vite + React 环境。
- [ ] 实现本地 API Server (Express 或 Fastify)。
- [ ] 开发 Profile 管理界面 (CRUD)。
- [ ] (Optional) 预设各大模型厂商的 Env 模板。

## 6. 常用命令参考 (Future)

*   `anyai ui` - 启动 Web 管理界面
*   `anyai list` - 列出所有可用 Profile
*   `anyai run <profile> -- <cmd>` - 以指定配置运行命令
*   `anyai set <profile> key=value` - 快速设置变量 (CLI 方式)
