import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { createProfile, deleteProfile, listProfiles, updateProfile, getProfile, getAllProfilesDecrypted, importProfile } from '../core/profiles';
import { encryptWithPassword, decryptWithPassword } from '../core/encryption';
import { Profile } from '../types';

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json({ limit: '10mb' })); // Increase limit for large imports

// Serve static files from the React frontend app
const clientBuildPath = path.join(__dirname, '../../web/dist');
if (fs.existsSync(clientBuildPath)) {
  app.use(express.static(clientBuildPath));
}

// Export all profiles (Encrypted)
app.post('/api/export', (req, res) => {
  try {
    const { password } = req.body;
    
    // We strictly require a password for export security
    if (!password) {
      return res.status(400).json({ error: 'Encryption password is required' });
    }

    const data = getAllProfilesDecrypted();
    const exportPayload = {
      meta: {
        version: 1,
        exported_at: new Date().toISOString(),
        app: 'anyaitoken',
        encrypted: true
      },
      data
    };

    const jsonString = JSON.stringify(exportPayload);
    const encryptedData = encryptWithPassword(jsonString, password);

    // Return as a wrapped object or raw string?
    // Let's return a JSON object containing the encrypted string
    res.json({ payload: encryptedData });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to export profiles' });
  }
});

// Import profiles (Encrypted)
app.post('/api/import', (req, res) => {
  try {
    const { payload, password } = req.body;
    let importData: any;

    // Handle Encrypted Payload
    if (typeof payload === 'string') {
      if (!password) {
        return res.status(400).json({ error: 'Password required for encrypted file' });
      }
      try {
        const decryptedJson = decryptWithPassword(payload, password);
        importData = JSON.parse(decryptedJson);
      } catch (e) {
        return res.status(401).json({ error: 'Invalid password or corrupted file' });
      }
    } else {
      // Fallback for legacy/plaintext imports if allowed (though we are moving to encrypted only)
      importData = payload;
    }
    
    // Basic validation
    if (!importData || !importData.meta || !Array.isArray(importData.data)) {
      return res.status(400).json({ error: 'Invalid import format' });
    }

    let importedCount = 0;
    for (const profile of importData.data) {
      try {
        importProfile(profile);
        importedCount++;
      } catch (e) {
        console.error(`Failed to import item:`, e);
      }
    }

    res.json({ message: `Successfully imported ${importedCount} profiles` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to process import' });
  }
});

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
