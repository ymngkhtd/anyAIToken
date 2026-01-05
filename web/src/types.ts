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
  provider: string; // Primary provider type (visual only)
  website?: string;
  created_at: string;
}

export interface DecryptedProfile extends Profile {
  website?: string;
  providers: ProviderConfig[];
}
