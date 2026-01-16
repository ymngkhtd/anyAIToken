import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { DB_PATH } from './paths';

// 确保目录存在
const dbDir = path.dirname(DB_PATH);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(DB_PATH);
// Enable WAL mode for better concurrency
db.pragma('journal_mode = WAL');

// 初始化表结构
export function initDB() {
  const createProfilesTable = `
    CREATE TABLE IF NOT EXISTS profiles (
      id TEXT PRIMARY KEY,
      name TEXT UNIQUE NOT NULL,
      provider TEXT NOT NULL,
      env_vars TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `;

  const createSettingsTable = `
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    )
  `;
  
  db.exec(createProfilesTable);
  db.exec(createSettingsTable);
}

export default db;
