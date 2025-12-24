
import React, { useState } from 'react';
import { Search, MapPin, Hash, Users, Activity, AtSign, Zap, ShieldAlert } from 'lucide-react';
import { SearchParams, SearchMode } from '../types';

interface InputFormProps {
  onSearch: (params: SearchParams) => void;
  disabled: boolean;
}

const NICHES = [
  "Health & Fitness",
  "Beauty & Cosmetics",
  "Real Estate & Property",
  "Marketing Agencies",
  "SaaS & Technology",
  "E-commerce / D2C",
  "Coaching & Consulting",
  "Restaurants & Hospitality",
  "Fashion & Apparel",
  "Interior Design",
  "Content Creators / Influencers",
  "Financial Services",
  "Legal Services",
  "Event Planning",
  "Photography & Videography",
  "Other"
];

export const InputForm: React.FC<InputFormProps> = ({ onSearch, disabled }) => {
  const [params, setParams] = useState<SearchParams>({
    niche: NICHES[0],
    location: '',
    competitor: '',
    leadCount: 10,
    mode: 'express',
    minFollowers: undefined,
    maxFollowers: undefined,
  });

  const [customNiche, setCustomNiche] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalNiche = params.niche === 'Other' ? customNiche : params.niche;
    onSearch({ ...params, niche: finalNiche });
  };

  const inputClass = "w-full bg-neutral-900 border border-neutral-800 rounded-md py-2.5 pl-10 pr-3 text-sm text-neutral-200 focus:outline-none focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/20 transition-all placeholder:text-neutral-600 disabled:opacity-50";
  const selectClass = "w-full bg-neutral-900 border border-neutral-800 rounded-md py-2.5 pl-10 pr-8 text-sm text-neutral-200 focus:outline-none focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/20 transition-all appearance-none cursor-pointer disabled:opacity-50";
  const iconClass = "absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-600";
  const labelClass = "block text-[10px] font-semibold text-neutral-500 mb-1.5 uppercase tracking-[0.15em]";

  return (
    <div className="bg-neutral-900/40 backdrop-blur-md p-6 rounded-xl border border-neutral-800/60 shadow-inner">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-medium text-white tracking-tight">System Vector</h2>
          <p className="text-[10px] text-neutral-600 uppercase tracking-widest mt-0.5 font-mono">Status: Ready</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className={labelClass}>Target Niche</label>
          <div className="relative">
            <div className={iconClass}><Hash className="h-4 w-4" /></div>
            <select
              required
              disabled={disabled}
              className={selectClass}
              value={params.niche}
              onChange={(e) => setParams({ ...params, niche: e.target.value })}
            >
              {NICHES.map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          {params.niche === 'Other' && (
             <div className="mt-2 relative">
                <div className={iconClass}><Hash className="h-4 w-4" /></div>
                <input
                  type="text"
                  required
                  disabled={disabled}
                  className={inputClass}
                  placeholder="Custom Vector"
                  value={customNiche}
                  onChange={(e) => setCustomNiche(e.target.value)}
                />
             </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Geo-Fence</label>
              <div className="relative">
                <div className={iconClass}><MapPin className="h-4 w-4" /></div>
                <input
                  type="text"
                  disabled={disabled}
                  className={inputClass}
                  placeholder="Location"
                  value={params.location}
                  onChange={(e) => setParams({ ...params, location: e.target.value })}
                />
              </div>
            </div>
            <div>
              <label className={labelClass}>Reference ID</label>
              <div className="relative">
                <div className={iconClass}><AtSign className="h-4 w-4" /></div>
                <input
                  type="text"
                  disabled={disabled}
                  className={inputClass}
                  placeholder="@handle"
                  value={params.competitor}
                  onChange={(e) => setParams({ ...params, competitor: e.target.value })}
                />
              </div>
            </div>
        </div>

        <div>
          <label className={labelClass}>Search Intensity</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              disabled={disabled}
              onClick={() => setParams({ ...params, mode: 'express' })}
              className={`flex items-center justify-center space-x-2 py-2.5 rounded-md border text-xs font-medium transition-all ${
                params.mode === 'express' 
                ? 'bg-teal-500/10 border-teal-500 text-teal-400' 
                : 'bg-neutral-900 border-neutral-800 text-neutral-500 hover:border-neutral-700'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Express</span>
            </button>
            <button
              type="button"
              disabled={disabled}
              onClick={() => setParams({ ...params, mode: 'forensic' })}
              className={`flex items-center justify-center space-x-2 py-2.5 rounded-md border text-xs font-medium transition-all ${
                params.mode === 'forensic' 
                ? 'bg-amber-500/10 border-amber-500 text-amber-400 shadow-[0_0_15px_-5px_rgba(245,158,11,0.3)]' 
                : 'bg-neutral-900 border-neutral-800 text-neutral-500 hover:border-neutral-700'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Forensic</span>
            </button>
          </div>
        </div>

        <div>
          <label className={labelClass}>Batch Volume</label>
          <div className="relative">
             <div className={iconClass}><Users className="h-4 w-4" /></div>
            <input
                type="number"
                min="1"
                max="50"
                disabled={disabled}
                className={inputClass}
                value={params.leadCount}
                onChange={(e) => setParams({ ...params, leadCount: parseInt(e.target.value) })}
            />
          </div>
        </div>

        {!disabled && (
            <button
            type="submit"
            className="w-full bg-white hover:bg-neutral-200 text-black font-bold text-xs py-3 rounded-md transition-all flex items-center justify-center space-x-2 mt-4 uppercase tracking-[0.2em] shadow-lg shadow-white/5"
            >
            <Activity className="w-4 h-4" /> 
            <span>Initialize Protocol</span>
            </button>
        )}
      </form>
    </div>
  );
};
