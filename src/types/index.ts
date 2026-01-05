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

  provider: string; 

  website?: string;

  

  // Stored as encrypted JSON string of ProviderConfig[]

  env_vars: string; 

  created_at: string;

}



export interface DecryptedProfile extends Omit<Profile, 'env_vars'> {

  website?: string;

  // Decrypted structure is now an array of providers

  providers: ProviderConfig[];

}
