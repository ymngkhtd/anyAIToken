import spawn from 'cross-spawn';
import { getProfile, getDefaultProfileName } from './profiles';
import { openaiSetupHook, openaiCleanupHook } from './hooks/openai';

export function runCommand(profileName: string | null, command: string, args: string[]) {
  let activeProfileName = profileName;
  
  if (!activeProfileName) {
    activeProfileName = getDefaultProfileName();
  }

  if (!activeProfileName) {
    console.error(`Error: No profile specified and no default profile set.`);
    console.log('Use "ais default <name>" to set a default profile.');
    process.exit(1);
  }

  const profile = getProfile(activeProfileName);
  
  if (!profile) {
    console.error(`Error: Profile '${activeProfileName}' not found.`);
    process.exit(1);
  }

  console.log(`[AIS] Using profile: ${activeProfileName}`);

  // Check for specialized hooks
  const hasOpenAI = profile.providers?.some(p => p.type === 'openai');

  // Flatten providers into a single env object
  const profileEnv: Record<string, string> = {};
  if (profile.providers) {
    profile.providers.forEach(provider => {
      provider.vars.forEach(v => {
        profileEnv[v.key] = v.value;
      });
    });
  }

  // Execute Pre-run hooks
  if (hasOpenAI) {
    openaiSetupHook(profileEnv);
  }

  // Merge current environment with profile variables
  const env = {
    ...process.env,
    ...profileEnv
  };

  // Spawn the child process
  const child = spawn(command, args, {
    env,
    stdio: 'inherit' // Pipe stdin/stdout/stderr directly
  });

  child.on('error', (err) => {
    console.error(`Failed to start command: ${command}`);
    console.error(err);
    if (hasOpenAI) openaiCleanupHook();
    process.exit(1);
  });

  child.on('close', (code) => {
    if (hasOpenAI) openaiCleanupHook();
    process.exit(code ?? 0);
  });
}
