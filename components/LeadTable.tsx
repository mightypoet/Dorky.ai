import React from 'react';
import { Lead } from '../types';
import { ExternalLink, Mail, Phone, Globe, Smartphone, UserPlus } from 'lucide-react';

interface LeadTableProps {
  leads: Lead[];
}

export const LeadTable: React.FC<LeadTableProps> = ({ leads }) => {
  if (leads.length === 0) return null;

  return (
    <div className="bg-neutral-900 rounded-lg border border-neutral-800 flex flex-col h-full shadow-sm">
      <div className="px-5 py-3 border-b border-neutral-800 flex justify-between items-center bg-neutral-900 rounded-t-lg">
        <h3 className="text-sm font-medium text-neutral-300">Intelligence Data</h3>
        <span className="text-[10px] font-mono bg-neutral-800 text-neutral-400 px-2 py-0.5 rounded-full">{leads.length} ITEMS</span>
      </div>
      <div className="overflow-auto flex-1 relative">
        <table className="w-full text-left text-sm text-neutral-400">
          <thead className="bg-neutral-800/50 text-neutral-500 text-[10px] uppercase tracking-wider font-medium sticky top-0 z-20 backdrop-blur-sm">
            <tr>
              <th className="px-5 py-3 font-medium">Identity</th>
              <th className="px-5 py-3 font-medium">Contact Points</th>
              <th className="px-5 py-3 font-medium">Metrics</th>
              <th className="px-5 py-3 font-medium text-center">Score</th>
              <th className="px-5 py-3 font-medium text-right">Access</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-800">
            {leads.map((lead) => (
              <tr key={lead.id} className="hover:bg-neutral-800/30 transition-colors group">
                <td className="px-5 py-3">
                  <div className="flex items-center">
                    <div>
                      <div className="font-medium text-neutral-200 text-sm">{lead.fullName}</div>
                      <div className="text-teal-500/80 text-xs font-mono mt-0.5">@{lead.username}</div>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3">
                  <div className="space-y-1.5">
                    {lead.email ? (
                      <div className="flex items-center text-neutral-300 text-xs"><Mail className="w-3 h-3 mr-2 text-teal-600"/> {lead.email}</div>
                    ) : <span className="text-neutral-700 text-[10px]">—</span>}
                    
                    {lead.phone ? (
                      <div className="flex items-center text-neutral-300 text-xs"><Smartphone className="w-3 h-3 mr-2 text-indigo-500"/> {lead.phone}</div>
                    ) : null}
                  </div>
                </td>
                <td className="px-5 py-3">
                  <div className="flex flex-col space-y-1">
                      <div className="flex items-center text-xs text-neutral-400">
                          <UserPlus className="w-3 h-3 mr-1.5 text-neutral-600" />
                          {lead.followers || 'N/A'}
                      </div>
                      <div className="text-[10px] text-neutral-600 uppercase tracking-tight">{lead.category}</div>
                  </div>
                </td>
                <td className="px-5 py-3">
                    <div className="flex justify-center">
                        <div className={`
                            w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium border
                            ${lead.engagementScore >= 70 ? 'bg-teal-900/20 border-teal-800 text-teal-400' : 
                              lead.engagementScore >= 40 ? 'bg-indigo-900/20 border-indigo-800 text-indigo-400' : 
                              'bg-neutral-800 border-neutral-700 text-neutral-500'}
                        `}>
                            {lead.engagementScore}
                        </div>
                    </div>
                </td>
                <td className="px-5 py-3 text-right">
                    <a 
                      href={`https://instagram.com/${lead.username}`} 
                      target="_blank" 
                      rel="noreferrer"
                      className="text-neutral-500 hover:text-white transition-colors inline-block p-1"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};