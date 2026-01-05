#!/usr/bin/env node
import { Command } from 'commander';
import { runCommand } from '../core/runner';
import { createProfile, listProfiles, deleteProfile } from '../core/profiles';

import { startServer } from '../server';

const program = new Command();

program
  .name('ais')
  .description('AI Token Switcher CLI')
  .version('1.0.0');

program
  .command('ui')
  .description('Start the Web Management Interface')
  .action(() => {
    startServer();
  });

program
  .command('list')
  .description('List all available profiles')
  .action(() => {
    const profiles = listProfiles();
    if (profiles.length === 0) {
      console.log('No profiles found.');
    } else {
      console.table(profiles);
    }
  });

program
  .command('add <name> <provider> [envVars...]')
  .description('Add a new profile (e.g. ais add my-claude claude ANTHROPIC_API_KEY=sk-...)')
  .action((name, provider, envVars) => {
    // Parse key=value strings
    const envMap: Record<string, string> = {};
    envVars.forEach((pair: string) => {
      const [key, ...values] = pair.split('=');
      if (key && values.length > 0) {
        envMap[key] = values.join('=');
      }
    });

    try {
      createProfile(name, provider as any, envMap);
      console.log(`Profile '${name}' created successfully.`);
    } catch (err: any) {
      console.error('Error creating profile:', err.message);
    }
  });

program
  .command('rm <name>')
  .description('Remove a profile')
  .action((name) => {
    if (deleteProfile(name)) {
      console.log(`Profile '${name}' deleted.`);
    } else {
      console.error(`Profile '${name}' not found.`);
    }
  });

program
  .command('run <profile>')
  .description('Run a command with the specified profile environment')
  .argument('[command...]', 'The command to run')
  .allowUnknownOption() // Allow flags like --version to be passed to the subprocess
  .action((profile, commandParts) => {
    if (!commandParts || commandParts.length === 0) {
      console.error('Error: No command specified to run.');
      return;
    }
    
    const cmd = commandParts[0];
    const args = commandParts.slice(1);
    
    console.log(`[AIS] Switching to profile: ${profile}`);
    runCommand(profile, cmd, args);
  });

program.parse(process.argv);
