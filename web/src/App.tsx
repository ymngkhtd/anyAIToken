import { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { Trash2, Plus, Terminal, Key, Database, Copy, Edit2, XCircle, ExternalLink, Download, Upload } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Profile, ProviderConfig, DecryptedProfile } from './types';
import { ProviderCard } from './components/ProviderCard';

function App() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Editor State
  const [isEditing, setIsEditing] = useState(false);
  const [editProfileName, setEditProfileName] = useState<string | null>(null); // Name of profile being edited (null if new)
  
  const [name, setName] = useState('');
  const [website, setWebsite] = useState('');
  const [providers, setProviders] = useState<ProviderConfig[]>([]);

  const fetchProfiles = async () => {
    try {
      const res = await axios.get('/api/profiles');
      setProfiles(res.data);
    } catch (error) {
      console.error('Failed to fetch profiles', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfiles();
  }, []);

  const handleExport = async () => {
    const password = prompt('Please set a password to encrypt your profiles for export:');
    if (!password) return; // Cancelled

    try {
      const res = await axios.post('/api/export', { password });
      // The server returns { payload: "encrypted_string" }
      const jsonString = JSON.stringify(res.data, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `ais-config-${new Date().toISOString().slice(0,10)}.ais`; // Use .ais extension to distinguish
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      alert('Export failed');
      console.error(error);
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const fileContent = JSON.parse(event.target?.result as string);
        let password = '';

        // Check if file is encrypted (has payload string)
        if (fileContent.payload && typeof fileContent.payload === 'string') {
           password = prompt('Enter password to decrypt this file:') || '';
           if (!password) return;
        }

        // Send to server (server handles decryption if password is provided)
        await axios.post('/api/import', { 
          payload: fileContent.payload || fileContent, // Send payload directly if encrypted, or full object if legacy
          password 
        });
        
        alert('Import successful!');
        fetchProfiles();
      } catch (error) {
        alert('Import failed: Invalid password or corrupted file');
        console.error(error);
      }
      // Reset input
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  const resetEditor = () => {
    setIsEditing(false);
    setEditProfileName(null);
    setName('');
    setWebsite('');
    setProviders([]);
  };

  const startNewProfile = () => {
    resetEditor();
    setIsEditing(true);
    // Add one default provider with Gemini template
    setProviders([{ 
      id: crypto.randomUUID(), 
      type: 'gemini', 
      vars: [
        { key: 'GOOGLE_API_KEY', value: '' },
        { key: 'GOOGLE_API_BASE_URL', value: '' }
      ] 
    }]);
  };

  const startEditProfile = async (profileName: string) => {
    try {
      const res = await axios.get<DecryptedProfile>(`/api/profiles/${profileName}`);
      const data = res.data;
      
      setName(data.name);
      setWebsite(data.website || '');
      setProviders(data.providers);
      setEditProfileName(data.name);
      setIsEditing(true);
    } catch (error) {
      alert('Failed to load profile details');
      console.error(error);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return alert('Profile name is required');
    if (providers.length === 0) return alert('At least one provider is required');

    try {
      if (editProfileName) {
        // Update existing
        await axios.put(`/api/profiles/${editProfileName}`, {
          providers,
          website
        });
      } else {
        // Create new
        await axios.post('/api/profiles', {
          name,
          // infer primary provider type from the first one
          provider: providers[0].type, 
          providers,
          website
        });
      }

      resetEditor();
      fetchProfiles();
    } catch (error) {
      const err = error as { response?: { data?: { error?: string } } };
      alert(err.response?.data?.error || 'Failed to save profile');
    }
  };

  const handleDelete = async (name: string) => {
    if (!confirm(`Are you sure you want to delete ${name}?`)) return;
    try {
      await axios.delete(`/api/profiles/${name}`);
      fetchProfiles();
    } catch (error) {
      console.error('Failed to delete', error);
    }
  };

  const copyCommand = (name: string) => {
    navigator.clipboard.writeText(`ais run ${name} -- `);
    // Could show a toast here
  };

  const addProvider = () => {
    setProviders([...providers, { 
      id: crypto.randomUUID(), 
      type: 'gemini', 
      vars: [
        { key: 'GOOGLE_API_KEY', value: '' },
        { key: 'GOOGLE_API_BASE_URL', value: '' }
      ] 
    }]);
  };

  const updateProvider = (index: number, updated: ProviderConfig) => {
    const newProviders = [...providers];
    newProviders[index] = updated;
    setProviders(newProviders);
  };

  const removeProvider = (index: number) => {
    const newProviders = providers.filter((_, i) => i !== index);
    setProviders(newProviders);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-8 font-sans">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
              <Database className="w-8 h-8 text-indigo-600" />
              AnyAIToken
            </h1>
            <p className="text-slate-500 mt-1">Manage your AI CLI tokens and profiles securely.</p>
          </div>
          {!isEditing && (
            <div className="flex gap-2">
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept=".json" 
                onChange={handleFileChange}
              />
              <button
                onClick={handleImportClick}
                className="bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 px-3 py-2 rounded-lg font-medium flex items-center gap-2 shadow-sm transition-colors text-sm"
              >
                <Upload className="w-4 h-4" />
                Import
              </button>
              <button
                onClick={handleExport}
                className="bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 px-3 py-2 rounded-lg font-medium flex items-center gap-2 shadow-sm transition-colors text-sm"
              >
                <Download className="w-4 h-4" />
                Export
              </button>
              <div className="w-px h-8 bg-slate-200 mx-1"></div>
              <button
                onClick={startNewProfile}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 shadow-sm transition-colors text-sm"
              >
                <Plus className="w-5 h-5" />
                New Profile
              </button>
            </div>
          )}
        </div>

        {isEditing ? (
          // EDITOR VIEW
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                {editProfileName ? <Edit2 className="w-5 h-5 text-indigo-600" /> : <Plus className="w-5 h-5 text-indigo-600" />}
                {editProfileName ? `Edit ${editProfileName}` : 'Create New Profile'}
              </h2>
              <button type="button" onClick={resetEditor} className="text-slate-400 hover:text-slate-600">
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="p-6 space-y-6">
              {/* Profile Name */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Profile Name</label>
                <input
                  type="text"
                  required
                  disabled={!!editProfileName} // Disable editing name for now to simplify update logic
                  placeholder="e.g. personal-workspace"
                  className="w-full md:w-1/2 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-100 disabled:text-slate-500"
                  value={name}
                  onChange={e => setName(e.target.value)}
                />
                <p className="text-xs text-slate-400 mt-1">This is the name you will use in the CLI (e.g. <code>ais run {name || '...'}</code>)</p>
              </div>

              {/* Website URL */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Provider Website (Optional)</label>
                <input
                  type="url"
                  placeholder="https://dashboard.example.com"
                  className="w-full md:w-1/2 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={website}
                  onChange={e => setWebsite(e.target.value)}
                />
                <p className="text-xs text-slate-400 mt-1">Quick access link to the provider's dashboard.</p>
              </div>

              {/* Providers List */}
              <div className="space-y-4">
                 <div className="flex items-center justify-between">
                    <label className="block text-sm font-medium text-slate-700">Providers Chain</label>
                    <button
                      type="button"
                      onClick={addProvider}
                      className="text-sm text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1"
                    >
                      <Plus className="w-4 h-4" />
                      Add Provider
                    </button>
                 </div>
                 
                 {providers.map((p, idx) => (
                   <ProviderCard
                     key={p.id || idx}
                     provider={p}
                     onUpdate={(updated) => updateProvider(idx, updated)}
                     onRemove={() => removeProvider(idx)}
                   />
                 ))}
                 
                 {providers.length === 0 && (
                   <div className="text-center py-8 border-2 border-dashed border-slate-200 rounded-lg text-slate-400">
                     No providers added. Add one to get started.
                   </div>
                 )}
              </div>

              {/* Actions */}
              <div className="pt-4 border-t border-slate-100 flex items-center gap-4">
                <button
                  type="submit"
                  className="bg-indigo-600 text-white py-2 px-6 rounded-lg hover:bg-indigo-700 transition-colors font-medium text-sm flex items-center gap-2 shadow-sm"
                >
                  <Key className="w-4 h-4" />
                  Save Configuration
                </button>
                <button
                  type="button"
                  onClick={resetEditor}
                  className="bg-white text-slate-700 border border-slate-300 py-2 px-6 rounded-lg hover:bg-slate-50 transition-colors font-medium text-sm"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        ) : (
          // LIST VIEW
          <div className="space-y-4">
             <h2 className="text-lg font-semibold flex items-center gap-2 text-slate-700">
                <Terminal className="w-5 h-5" />
                Available Profiles
              </h2>
            
            {loading ? (
              <div className="text-center py-10 text-slate-400">Loading...</div>
            ) : profiles.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-xl border border-dashed border-slate-300 text-slate-500">
                <Database className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                <p>No profiles found.</p>
                <button onClick={startNewProfile} className="text-indigo-600 font-medium hover:underline mt-2">Create your first profile</button>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {profiles.map(profile => (
                  <div key={profile.id} className="group bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all hover:border-indigo-200 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between mb-3">
                         <div className={cn(
                          "w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-sm",
                          profile.provider === 'claude' ? "bg-orange-500" :
                          profile.provider === 'gemini' ? "bg-blue-500" :
                          profile.provider === 'openai' ? "bg-green-500" : "bg-slate-500"
                        )}>
                          {profile.provider ? profile.provider[0].toUpperCase() : '?'}
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                           {profile.website && (
                             <a
                               href={profile.website}
                               target="_blank"
                               rel="noopener noreferrer"
                               className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                               title="Open Provider Website"
                             >
                               <ExternalLink className="w-4 h-4" />
                             </a>
                           )}
                           <button
                            onClick={() => startEditProfile(profile.name)}
                            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="Edit Profile"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                           <button
                            onClick={() => handleDelete(profile.name)}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete Profile"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      
                      <h3 className="font-bold text-slate-900 text-lg">{profile.name}</h3>
                      <div className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                        <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-600 font-medium">
                          {profile.provider}
                        </span>
                        <span>• {new Date(profile.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    
                    <button
                        onClick={() => copyCommand(profile.name)}
                        className="mt-4 w-full py-2 px-3 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-lg text-xs font-mono flex items-center justify-between group-active:bg-slate-200 transition-colors"
                        title="Click to copy command"
                      >
                        <span className="truncate">ais run {profile.name} -- ...</span>
                        <Copy className="w-3 h-3 ml-2" />
                      </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
