import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { createProfile, deleteProfile, listProfiles } from '../core/profiles';

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// Serve static files from the React frontend app
const clientBuildPath = path.join(__dirname, '../../web/dist');
if (fs.existsSync(clientBuildPath)) {
  app.use(express.static(clientBuildPath));
}

// Get all profiles (without sensitive env vars)
app.get('/api/profiles', (req, res) => {
  try {
    const profiles = listProfiles();
    res.json(profiles);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch profiles' });
  }
});

// Create a new profile
app.post('/api/profiles', (req, res) => {
  try {
    const { name, provider, env_vars } = req.body;
    
    if (!name || !provider || !env_vars) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const newProfile = createProfile(name, provider, env_vars);
    res.status(201).json({
      id: newProfile.id,
      name: newProfile.name,
      provider: newProfile.provider,
      created_at: newProfile.created_at
    });
  } catch (error: any) {
    // Handle unique constraint violation or other errors
    if (error.message && error.message.includes('UNIQUE constraint failed')) {
       return res.status(409).json({ error: 'Profile name already exists' });
    }
    res.status(500).json({ error: 'Failed to create profile' });
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
