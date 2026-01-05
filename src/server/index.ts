import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { createProfile, deleteProfile, listProfiles, updateProfile, getProfile } from '../core/profiles';
import { Profile } from '../types';

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// Serve static files from the React frontend app
const clientBuildPath = path.join(__dirname, '../../web/dist');
if (fs.existsSync(clientBuildPath)) {
  app.use(express.static(clientBuildPath));
}

// Get all profiles (summary)
app.get('/api/profiles', (req, res) => {
  try {
    const profiles = listProfiles();
    res.json(profiles);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch profiles' });
  }
});

// Get single profile details (decrypted)
app.get('/api/profiles/:name', (req, res) => {
  try {
    const { name } = req.params;
    const profile = getProfile(name);
    if (profile) {
      res.json(profile);
    }
    else {
      res.status(404).json({ error: 'Profile not found' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Create a new profile
app.post('/api/profiles', (req, res) => {
  try {
    const { name, provider, providers, website } = req.body;
    
    // Support legacy payload or new payload
    // If 'providers' is missing but 'env_vars' exists (old format), we might want to adapt, 
    // but the frontend will send 'providers' now.
    
    if (!name || (!provider && !providers)) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // If providers array is sent directly
    const providersData = providers || []; 

    const newProfile = createProfile(name, provider || 'custom', providersData, website);
    res.status(201).json({
      id: newProfile.id,
      name: newProfile.name,
      provider: newProfile.provider,
      website: newProfile.website,
      created_at: newProfile.created_at
    });
  } catch (error: any) {
    // Handle unique constraint violation or other errors
    if (error.message && error.message.includes('UNIQUE constraint failed')) {
       return res.status(409).json({ error: 'Profile name already exists' });
    }
    console.error(error);
    res.status(500).json({ error: 'Failed to create profile' });
  }
});

// Update a profile
app.put('/api/profiles/:name', (req, res) => {
  try {
    const { name } = req.params;
    const { providers, website } = req.body;

    if (!providers || !Array.isArray(providers)) {
      return res.status(400).json({ error: 'Invalid providers data' });
    }

    const success = updateProfile(name, providers, website);
    if (success) {
      res.status(200).json({ message: 'Profile updated' });
    } else {
      res.status(404).json({ error: 'Profile not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Delete a profile
app.delete('/api/profiles/:name', (req, res) => {
  try {
    const { name } = req.params;
    const success = deleteProfile(name);
    
    if (success) {
      res.status(200).json({ message: 'Profile deleted' });
    } else {
      res.status(404).json({ error: 'Profile not found' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete profile' });
  }
});

export function startServer() {
  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}
