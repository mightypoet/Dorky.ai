import React, { useEffect, useRef } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { Lead } from '../types';
import { User, CheckCircle2, XCircle, Zap } from 'lucide-react';

interface DashboardProps {
  leads: Lead[];
}

export const Dashboard: React.FC<DashboardProps> = ({ leads }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll the live feed to the bottom when new leads arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [leads.length]);

  if (leads.length === 0) return (
      <div className="h-full flex items-center justify-center text-neutral-700 text-sm font-light tracking-widest uppercase">
        Waiting for data stream...
      </div>
  );

  // Stats
  const emailCount = leads.filter(l => l.email).length;
  const noEmailCount = leads.length - emailCount;
  
  const highQuality = leads.filter(l => l.engagementScore >= 70).length;
  const midQuality = leads.filter(l => l.engagementScore >= 40 && l.engagementScore < 70).length;
  const lowQuality = leads.filter(l => l.engagementScore < 40).length;
  
  const qualityData = [
    { name: 'High', value: highQuality, fill: '#14b8a6' }, // Teal
    { name: 'Mid', value: midQuality, fill: '#6366f1' },   // Indigo
    { name: 'Low', value: lowQuality, fill: '#ef4444' },   // Red
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-full">
      
      {/* Chart 1: Quality */}
      <div className="bg-neutral-900/50 border border-neutral-800/50 p-4 rounded-lg flex flex-col justify-center">
         <div className="text-xs text-neutral-500 mb-2 uppercase tracking-wider font-semibold">Lead Quality</div>
         <div className="h-24">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={qualityData}>
                <Bar dataKey="value" radius={[2, 2, 0, 0]} barSize={20} />
                <Tooltip 
                    cursor={{fill: 'transparent'}}
                    contentStyle={{ backgroundColor: '#171717', borderColor: '#262626', fontSize: '12px', color: '#fff' }}
                />
              </BarChart>
            </ResponsiveContainer>
         </div>
      </div>

      {/* Chart 2: Contact Info */}
      <div className="bg-neutral-900/50 border border-neutral-800/50 p-4 rounded-lg flex flex-col justify-center">
         <div className="text-xs text-neutral-500 mb-2 uppercase tracking-wider font-semibold">Contact Rate</div>
         <div className="flex items-center justify-between px-4">
             <div className="text-center">
                 <div className="text-2xl font-light text-teal-400">{emailCount}</div>
                 <div className="text-[10px] text-neutral-600 uppercase">Found</div>
             </div>
             <div className="h-12 w-px bg-neutral-800"></div>
             <div className="text-center">
                 <div className="text-2xl font-light text-neutral-600">{noEmailCount}</div>
                 <div className="text-[10px] text-neutral-600 uppercase">Missing</div>
             </div>
         </div>
      </div>

      {/* Live Feed Scroller */}
      <div className="bg-neutral-900/50 border border-neutral-800/50 rounded-lg flex flex-col overflow-hidden relative group">
        <div className="px-4 py-2 bg-neutral-900/80 border-b border-neutral-800/50 flex justify-between items-center z-10 backdrop-blur-md">
            <span className="text-xs text-teal-500 font-mono animate-pulse flex items-center">
                <div className="w-1.5 h-1.5 bg-teal-500 rounded-full mr-2"></div>
                LIVE FEED
            </span>
            <span className="text-[10px] text-neutral-600">{leads.length} ITEMS</span>
        </div>
        
        <div 
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-2 space-y-2 scroll-smooth"
        >
            {leads.map((lead, idx) => (
                <div key={lead.id} className="flex items-center space-x-3 p-2 bg-neutral-900/40 rounded border border-neutral-800/30 hover:bg-neutral-800/50 transition-colors animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="w-8 h-8 rounded-full bg-neutral-800 flex items-center justify-center shrink-0 text-neutral-400">
                        <User className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium text-neutral-300 truncate">{lead.fullName}</div>
                        <div className="text-[10px] text-neutral-500 truncate">@{lead.username}</div>
                    </div>
                    <div className="flex flex-col items-end space-y-1">
                        {lead.email ? <CheckCircle2 className="w-3 h-3 text-teal-500/70" /> : <XCircle className="w-3 h-3 text-neutral-700" />}
                        {lead.engagementScore > 0 && (
                            <div className="text-[10px] font-mono text-neutral-600 flex items-center">
                                <Zap className="w-2 h-2 mr-1" />{lead.engagementScore}
                            </div>
                        )}
                    </div>
                </div>
            ))}
        </div>
        {/* Gradient fade at bottom for style */}
        <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-neutral-900 to-transparent pointer-events-none"></div>
      </div>
    </div>
  );
};