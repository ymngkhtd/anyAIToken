#!/usr/bin/env node
import { Command } from 'commander';
import { runCommand } from '../core/runner';
import { createProfile, listProfiles, deleteProfile, getDefaultProfileName, setDefaultProfileName } from '../core/profiles';

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
    const defaultProfile = getDefaultProfileName();
    
    if (profiles.length === 0) {
      console.log('No profiles found.');
    } else {
      const data = profiles.map(p => ({
        ...p,
        is_default: p.name === defaultProfile ? '★' : ''
      }));
      console.table(data);
    }
  });

program
  .command('default [name]')
  .description('Set or unset the global default profile')
  .option('--unset', 'Unset the current default profile')
  .action((name, options) => {
    if (options.unset) {
      setDefaultProfileName(null);
      console.log('Default profile unset.');
      return;
    }

    if (!name) {
      const current = getDefaultProfileName();
      if (current) {
        console.log(`Current default profile: ${current}`);
      } else {
        console.log('No default profile set.');
      }
      return;
    }

    try {
      setDefaultProfileName(name);
      console.log(`Default profile set to: ${name}`);
    } catch (err: any) {
      console.error(`Error: ${err.message}`);
    }
  });

program
  .command('add <name> <provider> [envVars...]')
  .description('Add a new profile (e.g. ais add my-claude claude ANTHROPIC_API_KEY=sk-...)')
  .action((name, provider, envVars) => {
    // Parse key=value strings
    const vars: { key: string, value: string }[] = [];
    envVars.forEach((pair: string) => {
      const [key, ...values] = pair.split('=');
      if (key && values.length > 0) {
        vars.push({ key, value: values.join('=') });
      }
    });

    // Default to a single provider for CLI added profiles
    const providersData = [{
      id: 'cli-generated',
      type: provider,
      vars
    }];

    try {
      createProfile(name, provider, providersData as any);
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
  .command('run [profile]')
  .description('Run a command with the specified or default profile environment')
  .argument('[command...]', 'The command to run')
  .allowUnknownOption() // Allow flags like --version to be passed to the subprocess
  .action((profile, commandParts) => {
    // If first argument is '--', commander puts it in commandParts and profile is undefined
    // If run like 'ais run ls', profile is 'ls' and commandParts is empty.
    // We need to handle the case where profile is actually the start of the command.
    
    let actualProfile = profile;
    let actualArgs = commandParts;

    if (profile && !commandParts.length) {
      // Case: ais run ls
      // If 'ls' is not a profile, it might be the command.
      const profiles = listProfiles();
      const isProfile = profiles.some(p => p.name === profile);
      
      if (!isProfile) {
        // Assume it's a command using default profile
        actualProfile = null;
        actualArgs = [profile];
      } else {
        // It IS a profile, but no command provided
        console.error(`Error: No command specified to run for profile '${profile}'.`);
        return;
      }
    } else if (!profile && !commandParts.length) {
        console.error('Error: No command specified to run.');
        return;
    }
    
    const cmd = actualArgs[0];
    const args = actualArgs.slice(1);
    
    runCommand(actualProfile || null, cmd, args);
  });

program.parse(process.argv);
