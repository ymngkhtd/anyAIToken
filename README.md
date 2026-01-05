# AnyAIToken (ais) 🚀 [中文](./README_zh.md)

**AnyAIToken** is a lightweight, secure, and unified CLI wrapper designed to manage and switch between multiple AI service providers (Gemini, OpenAI, Claude, etc.) and profiles seamlessly.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D%2018.0.0-brightgreen)](https://nodejs.org/)

---

## ✨ Key Features

- 🔒 **Local Security**: All sensitive API keys are encrypted using **AES-256-GCM** before being stored in a local SQLite database.
- 🌐 **Web Management UI**: A modern React-based dashboard to manage your profiles visually.
- 🧩 **Multi-Provider Support**: Group multiple environment variables (e.g., Gemini + OpenAI) into a single logical "Profile".
- ⚡ **Automation Hooks**: Automatically generates configuration files for specialized tools (e.g., GPT-Codex CLI).
- 📦 **Zero-Config Deployment**: No external database required. Single-file SQLite storage.

---

## 🚀 Quick Start

### Installation

```bash
git clone https://github.com/your-username/anyAIToken.git
cd anyAIToken
npm install
npm run build
npm link # Optional: makes 'ais' command available globally
```

### Usage

1. **Launch the Management UI**:
   ```bash
   ais ui
   ```
   Open `http://localhost:3000` to create your first profile.

2. **Run a command with a profile**:
   ```bash
   # Syntax: ais run <profile_name> -- <command>
   ais run personal-claude -- claude
   ```

---

## 🛠 Command Reference

| Command | Description |
| :--- | :--- |
| `ais ui` | Starts the Web Management Interface. |
| `ais list` | Lists all available profiles in the terminal. |
| `ais run <name> -- <cmd>` | Injects profile environment and executes the command. |
| `ais rm <name>` | Deletes a profile. |

---

## 🔌 Automation Hooks (Example: OpenAI/Codex)

When a profile contains an `openai` provider, `ais` automatically:
1. Backups your existing `~/.codex/config.toml` and `auth.json`.
2. Generates optimized config files based on your profile settings.
3. Restores your original configuration after the command finishes.

---

## 🤝 Contributing

We welcome all contributions! Whether it's reporting a bug, suggesting a feature, or submitting a pull request, your help is appreciated.

1. Fork the Project.
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`).
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`).
4. Push to the Branch (`git push origin feature/AmazingFeature`).
5. Open a Pull Request.

---

## 📜 License

Distributed under the MIT License. See `LICENSE` for more information.

---

