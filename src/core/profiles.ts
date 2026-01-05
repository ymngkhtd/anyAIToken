import db, { initDB } from './db';
import { encrypt, decrypt } from './encryption';
import { Profile, DecryptedProfile, ProviderConfig } from '../types';
import crypto from 'crypto';

// Ensure DB table exists
initDB();

export function createProfile(name: string, provider: string, providersData: ProviderConfig[]): Profile {
  const id = crypto.randomUUID();
  // Encrypt the entire providers array structure
  const envString = JSON.stringify(providersData);
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
    env_vars: encryptedEnv,
    created_at: new Date().toISOString()
  };
}

export function updateProfile(name: string, providersData: ProviderConfig[]): boolean {
  const envString = JSON.stringify(providersData);
  const encryptedEnv = encrypt(envString);

  const stmt = db.prepare(`
    UPDATE profiles 
    SET env_vars = ? 
    WHERE name = ?
  `);

  const info = stmt.run(encryptedEnv, name);
  return info.changes > 0;
}

export function getProfile(name: string): DecryptedProfile | null {
  const stmt = db.prepare('SELECT * FROM profiles WHERE name = ?');
  const profile = stmt.get(name) as Profile | undefined;

  if (!profile) return null;

  try {
    const decryptedString = decrypt(profile.env_vars);
    let parsedData: any;
    try {
      parsedData = JSON.parse(decryptedString);
    } catch {
      // Fallback for potentially malformed JSON (though unlikely if encrypted properly)
      parsedData = {};
    }

    // Normalize data to ProviderConfig[]
    // Old format: { "KEY": "VALUE" }
    // New format: [ { id, type, vars: [{key, value}] } ]
    let providers: any[] = [];

    if (Array.isArray(parsedData)) {
      providers = parsedData;
    } else {
      // Convert old format to new format single provider
      const vars = Object.entries(parsedData).map(([key, value]) => ({ key, value: String(value) }));
      if (vars.length > 0) {
        providers.push({
          id: 'legacy-1',
          type: profile.provider,
          vars
        });
      }
    }

    return {
      ...profile,
      providers: providers // This replaces the old 'env_vars' object in the return type
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
