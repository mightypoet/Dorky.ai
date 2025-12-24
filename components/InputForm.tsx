import React, { useState } from 'react';
import { Search, MapPin, Hash, Users, Activity, AtSign } from 'lucide-react';
import { SearchParams } from '../types';

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
    competitor: '', // Reference Instagram ID
    leadCount: 10,
    minFollowers: undefined,
    maxFollowers: undefined,
  });

  const [customNiche, setCustomNiche] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalNiche = params.niche === 'Other' ? customNiche : params.niche;
    onSearch({ ...params, niche: finalNiche });
  };

  const inputClass = "w-full bg-neutral-900 border border-neutral-800 rounded-sm py-2.5 pl-10 pr-3 text-sm text-neutral-200 focus:outline-none focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/20 transition-all placeholder:text-neutral-600 disabled:opacity-50";
  const selectClass = "w-full bg-neutral-900 border border-neutral-800 rounded-sm py-2.5 pl-10 pr-8 text-sm text-neutral-200 focus:outline-none focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/20 transition-all appearance-none cursor-pointer disabled:opacity-50";
  const iconClass = "absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-600";
  const labelClass = "block text-xs font-medium text-neutral-500 mb-1.5 uppercase tracking-wider";

  return (
    <div className="bg-neutral-900/50 backdrop-blur-sm p-6 rounded-lg border border-neutral-800/50">
      <div className="mb-6">
        <h2 className="text-lg font-light text-white tracking-tight">Parameters</h2>
        <p className="text-xs text-neutral-500">Configure target intelligence criteria.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className={labelClass}>Niche / Category</label>
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
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-neutral-600">
               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
            </div>
          </div>
          {params.niche === 'Other' && (
             <div className="mt-2 relative">
                <div className={iconClass}><Hash className="h-4 w-4" /></div>
                <input
                  type="text"
                  required
                  disabled={disabled}
                  className={inputClass}
                  placeholder="Specific Niche (e.g. Pottery)"
                  value={customNiche}
                  onChange={(e) => setCustomNiche(e.target.value)}
                />
             </div>
          )}
        </div>

        <div>
          <label className={labelClass}>Reference Instagram ID</label>
          <div className="relative">
            <div className={iconClass}><AtSign className="h-4 w-4" /></div>
            <input
              type="text"
              disabled={disabled}
              className={inputClass}
              placeholder="e.g. brand_handle (for lookalikes)"
              value={params.competitor}
              onChange={(e) => setParams({ ...params, competitor: e.target.value })}
            />
          </div>
        </div>

        <div>
          <label className={labelClass}>Location</label>
          <div className="relative">
            <div className={iconClass}><MapPin className="h-4 w-4" /></div>
            <input
              type="text"
              disabled={disabled}
              className={inputClass}
              placeholder="e.g. Berlin, Austin"
              value={params.location}
              onChange={(e) => setParams({ ...params, location: e.target.value })}
            />
          </div>
        </div>

        <div>
           <label className={labelClass}>Follower Range</label>
           <div className="grid grid-cols-2 gap-3">
             <div className="relative group">
                <span className="absolute left-3 top-2.5 text-xs text-neutral-600 font-mono">MIN</span>
                <input
                  type="number"
                  disabled={disabled}
                  className={`${inputClass} pl-10`}
                  placeholder="0"
                  value={params.minFollowers || ''}
                  onChange={(e) => setParams({ ...params, minFollowers: e.target.value ? parseInt(e.target.value) : undefined })}
                />
             </div>
             <div className="relative">
                <span className="absolute left-3 top-2.5 text-xs text-neutral-600 font-mono">MAX</span>
                <input
                  type="number"
                  disabled={disabled}
                  className={`${inputClass} pl-10`}
                  placeholder="∞"
                  value={params.maxFollowers || ''}
                  onChange={(e) => setParams({ ...params, maxFollowers: e.target.value ? parseInt(e.target.value) : undefined })}
                />
             </div>
           </div>
        </div>

        <div>
          <label className={labelClass}>Batch Size</label>
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
            className="w-full bg-neutral-100 hover:bg-white text-black font-medium text-sm py-2.5 rounded-sm transition-all flex items-center justify-center space-x-2 mt-4"
            >
            <div className="flex items-center"><Activity className="w-4 h-4 mr-2" /> Initialize Scan</div>
            </button>
        )}
      </form>
    </div>
  );
};