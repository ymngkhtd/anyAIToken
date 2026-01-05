import React from 'react';
import { Trash2, Plus, X } from 'lucide-react';
import type { ProviderConfig, EnvVar } from '../types';

interface ProviderCardProps {
  provider: ProviderConfig;
  onUpdate: (updated: ProviderConfig) => void;
  onRemove: () => void;
}

const PRESETS: Record<string, EnvVar[]> = {
  gemini: [
    { key: 'GOOGLE_API_KEY', value: '' },
    { key: 'GOOGLE_API_BASE_URL', value: '' }
  ],
  claude: [
    { key: 'ANTHROPIC_AUTH_TOKEN', value: '' },
    { key: 'ANTHROPIC_BASE_URL', value: '' }
  ],
  openai: [
    { key: 'OPENAI_API_KEY', value: '' },
    { key: 'OPENAI_BASE_URL', value: '' },
    { key: 'OPENAI_MODEL', value: 'gpt-5.2' },
    { key: 'OPENAI_MODEL_PROVIDER', value: 'anyProvider' },
    { key: 'OPENAI_REASONING_EFFORT', value: 'high' }
  ],
  custom: [
    { key: '', value: '' }
  ]
};

export const ProviderCard: React.FC<ProviderCardProps> = ({ provider, onUpdate, onRemove }) => {
  
  const handleTypeChange = (newType: ProviderConfig['type']) => {
    // Determine if we should overwrite existing vars with the new template
    // We overwrite if:
    // 1. Current vars are empty
    // 2. Current vars are exactly the same as another preset's keys (user hasn't customized yet)
    const currentKeys = provider.vars.map(v => v.key).filter(k => k !== '').join(',');
    const isDefaultOrEmpty = provider.vars.length === 0 || 
      Object.values(PRESETS).some(preset => 
        preset.map(v => v.key).filter(k => k !== '').join(',') === currentKeys
      );

    let newVars = [...provider.vars];
    if (isDefaultOrEmpty && PRESETS[newType]) {
      // Create a fresh copy of the preset to avoid reference sharing
      newVars = PRESETS[newType].map(v => ({ ...v }));
    }
    
    onUpdate({ ...provider, type: newType, vars: newVars });
  };

  const updateVar = (index: number, field: keyof EnvVar, val: string) => {
    const newVars = [...provider.vars];
    newVars[index] = { ...newVars[index], [field]: val };
    onUpdate({ ...provider, vars: newVars });
  };

  const addVar = () => {
    onUpdate({ ...provider, vars: [...provider.vars, { key: '', value: '' }] });
  };

  const removeVar = (index: number) => {
    const newVars = provider.vars.filter((_, i) => i !== index);
    onUpdate({ ...provider, vars: newVars });
  };

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-4 relative group">
      <button
        onClick={onRemove}
        className="absolute top-2 right-2 p-1 text-slate-400 hover:text-red-500 rounded-full hover:bg-slate-200 transition-colors"
        title="Remove Provider"
      >
        <X className="w-4 h-4" />
      </button>

      <div className="mb-4">
        <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Provider Type</label>
        <select
          className="w-full md:w-1/2 px-3 py-2 bg-white border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          value={provider.type}
          onChange={(e) => handleTypeChange(e.target.value as any)}
        >
          <option value="gemini">Google Gemini</option>
          <option value="claude">Anthropic Claude</option>
          <option value="openai">OpenAI / Compatible</option>
          <option value="custom">Custom</option>
        </select>
      </div>

      <div className="space-y-2">
        <label className="block text-xs font-semibold text-slate-500 uppercase">Environment Variables</label>
        {provider.vars.map((v, idx) => (
          <div key={idx} className="flex gap-2 items-center">
            <input
              type="text"
              placeholder="KEY (e.g. API_KEY)"
              className="flex-1 px-3 py-2 bg-white border border-slate-300 rounded-md text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={v.key}
              onChange={(e) => updateVar(idx, 'key', e.target.value)}
            />
            <span className="text-slate-400">=</span>
            <input
              type="text"
              placeholder="VALUE"
              className="flex-[2] px-3 py-2 bg-white border border-slate-300 rounded-md text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={v.value}
              onChange={(e) => updateVar(idx, 'value', e.target.value)}
            />
            <button
              type="button"
              onClick={() => removeVar(idx)}
              className="p-2 text-slate-400 hover:text-red-500 rounded-md transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
        
        <button
          type="button"
          onClick={addVar}
          className="text-xs font-medium text-indigo-600 hover:text-indigo-800 flex items-center gap-1 mt-2"
        >
          <Plus className="w-3 h-3" />
          Add Variable
        </button>
      </div>
    </div>
  );
};
