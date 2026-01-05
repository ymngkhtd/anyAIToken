import spawn from 'cross-spawn';
import { getProfile } from './profiles';

export function runCommand(profileName: string, command: string, args: string[]) {
  const profile = getProfile(profileName);
  
  if (!profile) {
    console.error(`Error: Profile '${profileName}' not found.`);
    process.exit(1);
  }

  // Merge current environment with profile variables
  const env = {
    ...process.env,
    ...profile.env_vars
  };

  // Spawn the child process
  const child = spawn(command, args, {
    env,
    stdio: 'inherit' // Pipe stdin/stdout/stderr directly
  });

  child.on('error', (err) => {
    console.error(`Failed to start command: ${command}`);
    console.error(err);
    process.exit(1);
  });

  child.on('close', (code) => {
    process.exit(code ?? 0);
  });
}
