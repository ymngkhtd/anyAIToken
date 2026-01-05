export interface Profile {
  id: string;
  name: string;
  provider: 'gemini' | 'claude' | 'openai' | 'custom';
  // 存储加密后的环境变量映射，例如: '{"GOOGLE_API_KEY": "enc_xxxxx"}'
  env_vars: string; 
  created_at: string;
}

export interface DecryptedProfile extends Omit<Profile, 'env_vars'> {
  env_vars: Record<string, string>;
}
