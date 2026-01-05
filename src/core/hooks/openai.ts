import fs from 'fs';
import path from 'path';
import os from 'os';

const CODEX_DIR = path.join(os.homedir(), '.codex');
const CONFIG_PATH = path.join(CODEX_DIR, 'config.toml');
const AUTH_PATH = path.join(CODEX_DIR, 'auth.json');

const BACKUP_SUFFIX = '.ais.bak';

export function openaiSetupHook(env: Record<string, string>) {
  // 1. Ensure directory exists
  if (!fs.existsSync(CODEX_DIR)) {
    fs.mkdirSync(CODEX_DIR, { recursive: true });
  }

  // 2. Backup existing files if they are not AIS backups
  backupFile(CONFIG_PATH);
  backupFile(AUTH_PATH);

  // 3. Extract variables with defaults
  const apiKey = env['OPENAI_API_KEY'] || '';
  const baseUrl = env['OPENAI_BASE_URL'] || 'https://api.openai.com/v1';
  const model = env['OPENAI_MODEL'] || 'gpt-5.2';
  const reasoning = env['OPENAI_REASONING_EFFORT'] || 'high';
  const provider = env['OPENAI_MODEL_PROVIDER'] || 'anyProvider';

  // 4. Generate config.toml
  const configToml = `
model_provider = "${provider}"
model = "${model}"
model_reasoning_effort = "${reasoning}"
network_access = "enabled"

[model_providers.${provider}]
name = "${provider}"
base_url = "${baseUrl}"
wire_api = "responses"
requires_openai_auth = true
`.trim();

  // 5. Generate auth.json
  const authJson = JSON.stringify({
    "OPENAI_API_KEY": apiKey
  }, null, 2);

  // 6. Write files
  fs.writeFileSync(CONFIG_PATH, configToml, 'utf8');
  fs.writeFileSync(AUTH_PATH, authJson, 'utf8');

  console.log(`[AIS] OpenAI Config Hooks: Generated files in ${CODEX_DIR}`);
}

export function openaiCleanupHook() {
  // Restore from backup
  restoreFile(CONFIG_PATH);
  restoreFile(AUTH_PATH);
}

function backupFile(filePath: string) {
  if (fs.existsSync(filePath)) {
    const backupPath = filePath + BACKUP_SUFFIX;
    // Only backup if a backup doesn't already exist (to avoid overwriting the original with AIS generated one)
    if (!fs.existsSync(backupPath)) {
      fs.copyFileSync(filePath, backupPath);
    }
  }
}

function restoreFile(filePath: string) {
  const backupPath = filePath + BACKUP_SUFFIX;
  if (fs.existsSync(backupPath)) {
    fs.copyFileSync(backupPath, filePath);
    fs.unlinkSync(backupPath); // Remove backup after restore
  } else if (fs.existsSync(filePath)) {
    // If no backup but file exists, it was likely created by us and didn't exist before.
    // However, AIS usually wants to keep the state clean. 
    // To be safe, we could delete it, but maybe just leave it for now.
  }
}
