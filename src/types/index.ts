export interface EnvVar {
  key: string;
  value: string;
}

export interface ProviderConfig {
  id: string;
  type: 'gemini' | 'claude' | 'openai' | 'custom';
  vars: EnvVar[];
}

export interface Profile {
  id: string;
  name: string;
  // Previously 'provider' was a string, now it's implicit in the providers array or we keep a default one. 
  // But to keep schema simple, we will reuse the 'env_vars' column to store the whole JSON structure of providers.
  // The 'provider' column in DB might become 'primary_provider_type' or just descriptive. 
  // Let's keep the DB schema 'provider' column for backward compatibility or as a 'primary' tag, 
  // but the real data lives in env_vars.
  provider: string; 
  
  // Stored as encrypted JSON string of ProviderConfig[]
  env_vars: string; 
  created_at: string;
}

export interface DecryptedProfile extends Omit<Profile, 'env_vars'> {
  // Decrypted structure is now an array of providers
  providers: ProviderConfig[];
}