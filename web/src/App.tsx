import { useEffect, useState } from 'react';
import axios from 'axios';
import { Trash2, Plus, Terminal, Key, Database, Copy } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Profile {
  id: string;
  name: string;
  provider: 'gemini' | 'claude' | 'openai' | 'custom';
  created_at: string;
}

function App() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    provider: 'gemini',
    envVars: ''
  });

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Parse envVars string (KEY=VALUE) into object
      const envMap: Record<string, string> = {};
      formData.envVars.split('\n').forEach(line => {
        const [key, ...val] = line.split('=');
        if (key && val.length) envMap[key.trim()] = val.join('=').trim();
      });

      await axios.post('/api/profiles', {
        name: formData.name,
        provider: formData.provider,
        env_vars: envMap
      });

      setFormData({ name: '', provider: 'gemini', envVars: '' });
      fetchProfiles();
    } catch (error) {
      alert('Failed to create profile. Name might be duplicate.');
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
    alert('Copied to clipboard: ais run ' + name + ' -- ');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
              <Database className="w-8 h-8 text-indigo-600" />
              AnyAIToken
            </h1>
            <p className="text-slate-500 mt-1">Manage your AI CLI tokens and profiles securely.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Form Section */}
          <div className="md:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Plus className="w-5 h-5" />
                New Profile
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. work-claude"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Provider</label>
                  <select
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                    value={formData.provider}
                    onChange={e => setFormData({ ...formData, provider: e.target.value })}
                  >
                    <option value="gemini">Gemini</option>
                    <option value="claude">Claude</option>
                    <option value="openai">OpenAI</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Environment Variables
                    <span className="text-xs text-slate-400 font-normal ml-1">(KEY=VALUE per line)</span>
                  </label>
                  <textarea
                    required
                    placeholder="ANTHROPIC_API_KEY=sk-..."
                    rows={4}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm font-mono"
                    value={formData.envVars}
                    onChange={e => setFormData({ ...formData, envVars: e.target.value })}
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors font-medium text-sm flex items-center justify-center gap-2"
                >
                  <Key className="w-4 h-4" />
                  Save Encrypted
                </button>
              </form>
            </div>
          </div>

          {/* List Section */}
          <div className="md:col-span-2 space-y-4">
             <h2 className="text-lg font-semibold flex items-center gap-2">
                <Terminal className="w-5 h-5" />
                Active Profiles
              </h2>
            
            {loading ? (
              <div className="text-center py-10 text-slate-400">Loading...</div>
            ) : profiles.length === 0 ? (
              <div className="text-center py-10 bg-white rounded-xl border border-dashed border-slate-300 text-slate-500">
                No profiles found. Create one to get started.
              </div>
            ) : (
              <div className="grid gap-3">
                {profiles.map(profile => (
                  <div key={profile.id} className="group bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm uppercase",
                        profile.provider === 'claude' ? "bg-orange-500" :
                        profile.provider === 'gemini' ? "bg-blue-500" :
                        profile.provider === 'openai' ? "bg-green-500" : "bg-slate-500"
                      )}>
                        {profile.provider[0]}
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-900">{profile.name}</h3>
                        <p className="text-xs text-slate-500">Provider: {profile.provider} • Created: {new Date(profile.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => copyCommand(profile.name)}
                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        title="Copy usage command"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(profile.name)}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete profile"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}

export default App;