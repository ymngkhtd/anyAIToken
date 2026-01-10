import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import os from 'os';

const ALGORITHM = 'aes-256-gcm';
const KEY_FILE_PATH = path.join(os.homedir(), '.anyaitoken', '.key');

// 确保 Key 存在
function getOrGenerateKey(): Buffer {
  const dir = path.dirname(KEY_FILE_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  if (fs.existsSync(KEY_FILE_PATH)) {
    return fs.readFileSync(KEY_FILE_PATH);
  } else {
    const key = crypto.randomBytes(32); // 256 bits
    fs.writeFileSync(KEY_FILE_PATH, key, { mode: 0o600 }); // Only owner can read
    return key;
  }
}

const MASTER_KEY = getOrGenerateKey();

export function encrypt(text: string): string {
  const iv = crypto.randomBytes(12); // GCM standard IV size
  const cipher = crypto.createCipheriv(ALGORITHM, MASTER_KEY, iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');

  // Format: iv:authTag:encrypted
  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

export function decrypt(text: string): string {
  const parts = text.split(':');
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted text format');
  }

  const [ivHex, authTagHex, encryptedHex] = parts;
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  
  const decipher = crypto.createDecipheriv(ALGORITHM, MASTER_KEY, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

// 基于密码的加密 (用于导出)
export function encryptWithPassword(text: string, password: string): string {
  const salt = crypto.randomBytes(16);
  // Derive a 32-byte key using scrypt
  const key = crypto.scryptSync(password, salt, 32);
  const iv = crypto.randomBytes(12);
  
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');

  // Format: salt:iv:authTag:encrypted
  return `${salt.toString('hex')}:${iv.toString('hex')}:${authTag}:${encrypted}`;
}

// 基于密码的解密 (用于导入)
export function decryptWithPassword(text: string, password: string): string {
  const parts = text.split(':');
  if (parts.length !== 4) {
    throw new Error('Invalid encrypted format');
  }

  const [saltHex, ivHex, authTagHex, encryptedHex] = parts;
  
  const salt = Buffer.from(saltHex, 'hex');
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  
  const key = crypto.scryptSync(password, salt, 32);
  
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}
