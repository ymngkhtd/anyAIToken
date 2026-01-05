import db, { initDB } from './db';
import { encrypt, decrypt } from './encryption';
import { Profile, DecryptedProfile } from '../types';
import crypto from 'crypto';

// Ensure DB table exists
initDB();

export function createProfile(name: string, provider: Profile['provider'], envVars: Record<string, string>): Profile {
  const id = crypto.randomUUID();
  const envString = JSON.stringify(envVars);
  const encryptedEnv = encrypt(envString);

  const stmt = db.prepare(`
    INSERT INTO profiles (id, name, provider, env_vars)
    VALUES (?, ?, ?, ?)
  `);

  stmt.run(id, name, provider, encryptedEnv);

  return {
    id,
    name,
    provider,
    env_vars: encryptedEnv, // Return encrypted state
    created_at: new Date().toISOString() // Approximate
  };
}

export function getProfile(name: string): DecryptedProfile | null {
  const stmt = db.prepare('SELECT * FROM profiles WHERE name = ?');
  const profile = stmt.get(name) as Profile | undefined;

  if (!profile) return null;

  try {
    const decryptedEnvString = decrypt(profile.env_vars);
    const env_vars = JSON.parse(decryptedEnvString);
    return {
      ...profile,
      env_vars
    };
  } catch (error) {
    console.error(`Failed to decrypt profile ${name}`, error);
    throw new Error('Decryption failed');
  }
}

export function listProfiles(): Omit<Profile, 'env_vars'>[] {
  const stmt = db.prepare('SELECT id, name, provider, created_at FROM profiles');
  return stmt.all() as Omit<Profile, 'env_vars'>[];
}

export function deleteProfile(name: string): boolean {
  const stmt = db.prepare('DELETE FROM profiles WHERE name = ?');
  const info = stmt.run(name);
  return info.changes > 0;
}
