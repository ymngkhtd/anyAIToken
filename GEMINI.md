# AnyAIToken (AI-Switch) 项目架构文档

## 1. 项目概述
本项目旨在开发一个跨平台（Windows, Linux, macOS）的 CLI 工具，用于方便地管理和切换不同大模型工具（Gemini CLI, Codex CLI, Claude Code 等）的 Token 和 API Endpoint 配置。

**核心理念：** 简单、本地化、安全、零依赖（无需安装外部数据库）。

## 2. 技术栈架构 (Tech Stack)

*   **Runtime**: Node.js (TypeScript)
*   **Frontend**: React + Vite + TailwindCSS + Shadcn/UI (Lucide Icons)
*   **Backend/CLI**: Node.js + Commander.js + Cross-Spawn
*   **Database**: SQLite (`better-sqlite3`) - 单文件存储
*   **Security**: AES-256-GCM 加密 (用于存储 API Keys)

## 3. 系统设计 (System Design)

### 3.1 核心工作流 (Workflow)
1.  **Web UI 管理**: 用户通过 `ais ui` 启动本地服务，在界面上创建和编辑 Profile。每个 Profile 可以包含多个 Provider（如 Gemini, OpenAI, Claude）。
2.  **数据存储**: 数据以加密 JSON 字符串形式存储在 SQLite 数据库中。
3.  **CLI 执行**: 
    *   用户运行 `ais run <profile> -- <command>`。
    *   `ais` 解密对应的 Profile 结构，将所有 Provider 的环境变量拍平 (Flatten)。
    *   注入 `process.env` 并通过子进程启动目标命令。

### 3.2 数据结构 (Data Schema)

**Profiles 表**
| Field | Type | Description |
| :--- | :--- | :--- |
| id | UUID | 主键 |
| name | String | 唯一标识 |
| provider | String | 主 Provider 类型 (主要用于前端图标展示) |
| env_vars | Encrypted JSON | 存储 `ProviderConfig[]` 结构的加密字符串 |

**ProviderConfig 结构**
```typescript
{
  id: string;
  type: 'gemini' | 'claude' | 'openai' | 'custom';
  vars: { key: string, value: string }[];
}
```

## 4. 开发路线图 (Roadmap)

### Phase 1: 核心引擎 (Core Engine) - [x]
### Phase 2: CLI 执行器 (The Wrapper) - [x]
### Phase 3: 可视化管理 (Web UI) - [x]
### Phase 4: 多 Provider 重构 (Multi-Provider Support) - [x]
- [x] **Backend**: 支持 Provider 数组加密存储与解密。
- [x] **Runner**: 适配多 Provider 环境变量拍平注入。
- [x] **API**: 实现 CRUD 完整接口（GET/POST/PUT/DELETE）。
- [x] **Frontend**: 实现 `ProviderCard` 组件与复杂 Profile 编辑器。

## 5. 常用命令参考

*   `ais ui` - 启动 Web 管理界面
*   `ais list` - 列出所有可用 Profile
*   `ais run <profile> -- <cmd>` - 以指定配置运行命令

---

## 6. 使用技巧与常见问题 (Tips & Troubleshooting)

### 6.1 环境变量解析陷阱 (Shell Expansion)
**问题**: 在使用 `ais run profile -- echo $ENV_VAR` 时，输出的可能不是 Profile 中配置的值。
**原因**: 大多数 Shell (如 PowerShell, Zsh) 会在命令传给 `ais` 之前就尝试解析变量。
**解决**: 
*   **验证配置**: 使用 Node.js 验证：
    ```bash
    ais run <name> -- node -e "console.log(process.env.YOUR_VAR)"
    ```
*   **Windows (PowerShell)**: 使用单引号包裹命令或调用 `cmd /c`：
    ```powershell
    ais run <name> -- cmd /c 'echo %YOUR_VAR%'
    ```
