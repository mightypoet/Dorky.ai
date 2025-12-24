
import React, { useState, useCallback, useRef } from 'react';
import { Download, BrainCircuit, Activity, Database, Sparkles, Pause, Play, Square, Save, ShieldAlert, Zap } from 'lucide-react';
import { InputForm } from './components/InputForm.tsx';
import { Terminal } from './components/Terminal.tsx';
import { LeadTable } from './components/LeadTable.tsx';
import { Dashboard } from './components/Dashboard.tsx';
import { Lead, LogEntry, SearchParams, AppState } from './types.ts';
import { GeminiService } from './services/geminiService.ts';
import { exportToCSV } from './services/exportService.ts';

const App: React.FC = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [currentProgress, setCurrentProgress] = useState(0);
  
  // Control refs
  const abortControllerRef = useRef<boolean>(false);
  const pauseSignalRef = useRef<boolean>(false);

  const addLog = useCallback((message: string, type: LogEntry['type'] = 'info') => {
    setLogs(prev => [...prev, {
      id: Math.random().toString(36).substring(2, 9),
      timestamp: Date.now(),
      message,
      type
    }]);
  }, []);

  const handleSearch = async (params: SearchParams) => {
    setAppState(AppState.SEARCHING);
    setLeads([]);
    setLogs([]);
    setCurrentProgress(0);
    
    abortControllerRef.current = false;
    pauseSignalRef.current = false;

    const gemini = new GeminiService();
    
    addLog(`System initialized. Protocol: Dorky.ai [${params.mode.toUpperCase()}]`, "info");
    addLog(`Target Vector: ${params.niche}`, "info");
    if (params.location) addLog(`Geo-Fence: ${params.location}`, "info");

    try {
      addLog(`Searching for handles via site:instagram.com...`, "dork");
      const discoveredProfiles = await gemini.discoverLeads(params);
      
      if (discoveredProfiles.length === 0) {
        addLog("No targets identified. Adjust vector parameters.", "warning");
        setAppState(AppState.IDLE);
        return;
      }

      addLog(`Successfully identified ${discoveredProfiles.length} candidates.`, "success");
      addLog(`Initiating ${params.mode === 'forensic' ? 'Forensic' : 'Express'} Enrichment...`, "info");
      setAppState(AppState.ENRICHING);

      for (let i = 0; i < discoveredProfiles.length; i++) {
        if (abortControllerRef.current) break;
        while (pauseSignalRef.current) {
            await new Promise(r => setTimeout(r, 500));
            if (abortControllerRef.current) break;
        }
        if (abortControllerRef.current) break;

        const rawProfile = discoveredProfiles[i];
        
        // Add artificial delay for rate limit safety and visual pacing
        const delay = params.mode === 'forensic' ? 1200 : 600;
        await new Promise(r => setTimeout(r, delay));
        
        try {
            const enrichedLead = await gemini.enrichLead({
                ...rawProfile,
                niche: params.niche,
                location: params.location
            }, params.mode);
            
            if (enrichedLead.email || enrichedLead.phone) {
               addLog(`+ Entity Decrypted: ${enrichedLead.username} (Contact Found)`, "success");
            } else {
               addLog(`> Indexed: ${enrichedLead.username}`, "info");
            }

            setLeads(prev => [...prev, enrichedLead]);
        } catch (e) {
            addLog(`Failed to enrich: ${rawProfile.username}`, "error");
        }

        setCurrentProgress(Math.round(((i + 1) / discoveredProfiles.length) * 100));
      }

      setAppState(AppState.COMPLETE);
      addLog("Intelligence operation concluded successfully.", "success");

    } catch (error) {
      addLog(`Critical Failure: ${(error as Error).message}`, "error");
      setAppState(AppState.ERROR);
    }
  };

  const handleStop = () => {
      abortControllerRef.current = true;
      pauseSignalRef.current = false;
      setAppState(AppState.COMPLETE);
      addLog("Manual termination received.", "warning");
  };

  const handlePause = () => {
      pauseSignalRef.current = true;
      setAppState(AppState.PAUSED);
      addLog("System on standby.", "warning");
  };

  const handleResume = () => {
      pauseSignalRef.current = false;
      setAppState(AppState.ENRICHING);
      addLog("Resuming extraction...", "info");
  };

  const handleExport = () => {
    exportToCSV(leads, `osint_dataset_${Date.now()}`);
    addLog("Intelligence report exported to CSV.", "success");
  };

  return (
    <div className="flex h-screen bg-[#0a0a0a] text-neutral-200 overflow-hidden font-sans selection:bg-teal-500/30">
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] pointer-events-none"></div>

      {/* Sidebar */}
      <div className="w-[380px] flex flex-col border-r border-neutral-900 bg-black h-full relative z-20 shadow-[10px_0_30px_rgba(0,0,0,0.5)]">
        <div className="p-8 pb-4">
          <div className="flex items-center space-x-3 mb-1">
            <div className="bg-teal-500 text-black p-1.5 rounded-md shadow-[0_0_15px_rgba(20,184,166,0.3)]">
                <BrainCircuit className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-white uppercase italic">Dorky.ai</h1>
          </div>
          <p className="text-[10px] text-neutral-500 ml-11 tracking-widest font-mono">EXTRACT_PROTOCOL_V2</p>
        </div>
        
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6 scrollbar-hide">
          <InputForm onSearch={handleSearch} disabled={appState === AppState.SEARCHING || appState === AppState.ENRICHING || appState === AppState.PAUSED} />
          
          {(appState === AppState.SEARCHING || appState === AppState.ENRICHING || appState === AppState.PAUSED) && (
              <div className="bg-neutral-900/50 border border-neutral-800 p-4 rounded-xl space-y-3 shadow-xl">
                  <div className="flex items-center justify-between text-[10px] text-neutral-500 uppercase tracking-widest mb-1">
                      <span>Live Controller</span>
                      <span className={`w-1.5 h-1.5 rounded-full ${appState === AppState.PAUSED ? 'bg-amber-500' : 'bg-teal-500 animate-pulse shadow-[0_0_8px_rgba(20,184,166,1)]'}`}></span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                      {appState === AppState.PAUSED ? (
                          <button onClick={handleResume} className="bg-teal-900/10 hover:bg-teal-900/30 text-teal-400 border border-teal-900/50 rounded-lg p-3 flex flex-col items-center justify-center transition-all group">
                              <Play className="w-4 h-4 mb-1 group-hover:scale-110" />
                              <span className="text-[10px]">Resume</span>
                          </button>
                      ) : (
                          <button onClick={handlePause} className="bg-amber-900/10 hover:bg-amber-900/30 text-amber-400 border border-amber-900/50 rounded-lg p-3 flex flex-col items-center justify-center transition-all group">
                              <Pause className="w-4 h-4 mb-1 group-hover:scale-110" />
                              <span className="text-[10px]">Pause</span>
                          </button>
                      )}
                      <button onClick={handleStop} className="bg-rose-900/10 hover:bg-rose-900/30 text-rose-400 border border-rose-900/50 rounded-lg p-3 flex flex-col items-center justify-center transition-all group">
                          <Square className="w-4 h-4 mb-1 group-hover:scale-110" />
                          <span className="text-[10px]">Stop</span>
                      </button>
                      <button onClick={handleExport} className="bg-neutral-800/30 hover:bg-neutral-800/60 text-neutral-400 border border-neutral-700/50 rounded-lg p-3 flex flex-col items-center justify-center transition-all group">
                          <Save className="w-4 h-4 mb-1 group-hover:scale-110" />
                          <span className="text-[10px]">Export</span>
                      </button>
                  </div>
              </div>
          )}

          <Terminal logs={logs} />
          
          {appState === AppState.COMPLETE && leads.length > 0 && (
            <div className="bg-teal-900/10 border border-teal-500/20 p-4 rounded-xl flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-teal-400 uppercase tracking-widest">Operation Complete</p>
                <p className="text-[10px] text-teal-700 font-mono">{leads.length} profiles secured</p>
              </div>
              <button 
                onClick={handleExport}
                className="bg-teal-500 hover:bg-teal-400 text-black p-2.5 rounded-lg transition-all shadow-lg shadow-teal-500/20"
              >
                <Download className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-neutral-900 text-[10px] text-neutral-700 text-center uppercase tracking-[0.3em] font-mono">
          Secured Interface
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#0d0d0d] relative">
        <div className="h-[280px] p-6 border-b border-neutral-900/80 z-10">
          <div className="flex items-center space-x-3 mb-4">
             <div className="w-2 h-2 rounded-full bg-teal-500 shadow-[0_0_8px_rgba(20,184,166,1)]"></div>
             <h2 className="text-xs font-bold text-neutral-500 uppercase tracking-[0.2em]">Matrix Visualization</h2>
          </div>
          <Dashboard leads={leads} />
        </div>

        <div className="flex-1 p-6 overflow-hidden flex flex-col z-10">
          <div className="flex items-center justify-between mb-4">
             <div className="flex items-center space-x-3">
                <Database className="w-4 h-4 text-teal-500" />
                <h2 className="text-xs font-bold text-neutral-500 uppercase tracking-[0.2em]">Active Entities</h2>
             </div>
             {appState === AppState.ENRICHING && (
                <div className="flex items-center space-x-4 bg-black/40 px-4 py-2 rounded-full border border-neutral-800">
                    <div className="h-1.5 w-32 bg-neutral-900 rounded-full overflow-hidden">
                        <div className="h-full bg-teal-500 transition-all duration-500 shadow-[0_0_10px_rgba(20,184,166,0.5)]" style={{ width: `${currentProgress}%` }}></div>
                    </div>
                    <span className="text-[10px] font-mono text-teal-500 tabular-nums">{currentProgress}%</span>
                </div>
             )}
          </div>
          <div className="flex-1 relative">
            <LeadTable leads={leads} />
            {leads.length === 0 && appState === AppState.IDLE && (
              <div className="absolute inset-0 flex items-center justify-center flex-col">
                 <div className="w-24 h-24 bg-teal-500/5 rounded-full flex items-center justify-center mb-6 border border-teal-500/10 animate-pulse">
                    <Sparkles className="w-10 h-10 text-teal-900" />
                 </div>
                 <p className="text-neutral-400 font-medium text-lg tracking-tight">System on Standby</p>
                 <p className="text-neutral-600 text-[10px] mt-2 uppercase tracking-[0.2em]">Awaiting Uplink Parameters</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
