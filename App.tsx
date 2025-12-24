import React, { useState, useCallback, useRef } from 'react';
import { Download, BrainCircuit, Activity, Database, AlertCircle, Sparkles, Pause, Play, Square, Save } from 'lucide-react';
import { InputForm } from './components/InputForm';
import { Terminal } from './components/Terminal';
import { LeadTable } from './components/LeadTable';
import { Dashboard } from './components/Dashboard';
import { Lead, LogEntry, SearchParams, AppState } from './types';
import { GeminiService } from './services/geminiService';
import { exportToCSV } from './services/exportService';

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
    if (!process.env.API_KEY) {
      addLog("ERROR: API_KEY is not defined.", "error");
      setAppState(AppState.ERROR);
      return;
    }

    setAppState(AppState.SEARCHING);
    setLeads([]);
    setLogs([]);
    setCurrentProgress(0);
    
    // Reset control flags
    abortControllerRef.current = false;
    pauseSignalRef.current = false;

    const gemini = new GeminiService();
    
    addLog("System initialized. Protocol: Dorky.ai", "info");
    addLog(`Vector: ${params.niche}`, "info");
    if (params.location) addLog(`Geo-fence: ${params.location}`, "info");
    if (params.competitor) addLog(`Reference ID: ${params.competitor}`, "info");

    try {
      const discoveredProfiles = await gemini.discoverLeads(params);
      
      if (discoveredProfiles.length === 0) {
        addLog("0 Targets found matching strict criteria.", "warning");
        addLog("Suggestion: Broaden location or remove specific constraints.", "info");
        setAppState(AppState.IDLE);
        return;
      }

      addLog(`Identified ${discoveredProfiles.length} candidates. Initiating Deep Scan...`, "success");
      setAppState(AppState.ENRICHING);

      for (let i = 0; i < discoveredProfiles.length; i++) {
        // Check for Stop
        if (abortControllerRef.current) {
            addLog("Process aborted by user.", "warning");
            break;
        }

        // Check for Pause
        while (pauseSignalRef.current) {
            await new Promise(r => setTimeout(r, 500));
            // Check abort again inside pause loop
            if (abortControllerRef.current) break;
        }
        if (abortControllerRef.current) break;

        const rawProfile = discoveredProfiles[i];
        
        // Use a subtle delay to not overwhelm
        await new Promise(r => setTimeout(r, 800));
        
        try {
            const enrichedLead = await gemini.enrichLead({
                ...rawProfile,
                niche: params.niche,
                location: params.location // Pass target location for verification
            });
            
            // Log successful extraction
            if (enrichedLead.phone) {
               addLog(`+ Contact Extracted: ${enrichedLead.username} [PHONE]`, "success");
            } else if (enrichedLead.email) {
               addLog(`+ Contact Extracted: ${enrichedLead.username} [EMAIL]`, "success");
            } else {
               addLog(`> Analyzed: ${enrichedLead.username}`, "info");
            }

            setLeads(prev => [...prev, enrichedLead]);
            
        } catch (e) {
            addLog(`Analysis failed: ${rawProfile.username}`, "error");
        }

        setCurrentProgress(Math.round(((i + 1) / discoveredProfiles.length) * 100));
      }

      setAppState(AppState.COMPLETE);
      addLog("Intelligence gathering session ended.", "success");

    } catch (error) {
      addLog(`System Failure: ${(error as Error).message}`, "error");
      setAppState(AppState.ERROR);
    }
  };

  const handleStop = () => {
      abortControllerRef.current = true;
      pauseSignalRef.current = false; // Unpause so it can break
      setAppState(AppState.COMPLETE);
  };

  const handlePause = () => {
      pauseSignalRef.current = true;
      setAppState(AppState.PAUSED);
      addLog("Process paused.", "warning");
  };

  const handleResume = () => {
      pauseSignalRef.current = false;
      setAppState(AppState.ENRICHING);
      addLog("Process resumed.", "info");
  };

  const handleExport = () => {
    exportToCSV(leads, `dorky_ai_export_${Date.now()}`);
    addLog("Dataset exported.", "success");
  };

  return (
    <div className="flex h-screen bg-neutral-950 text-neutral-200 overflow-hidden font-sans selection:bg-teal-500/30">
      
      {/* Sidebar */}
      <div className="w-[380px] flex flex-col border-r border-neutral-900 bg-neutral-950 h-full relative z-20 shadow-2xl shadow-black/50">
        <div className="p-8 pb-4">
          <div className="flex items-center space-x-3 mb-1">
            <div className="bg-white text-black p-1.5 rounded-md">
                <BrainCircuit className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-medium tracking-tight text-white">Dorky.ai</h1>
          </div>
          <p className="text-xs text-neutral-500 ml-10">Automated OSINT Intelligence</p>
        </div>
        
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6 scrollbar-hide">
          <InputForm onSearch={handleSearch} disabled={appState === AppState.SEARCHING || appState === AppState.ENRICHING || appState === AppState.PAUSED} />
          
          {/* Active Process Controls */}
          {(appState === AppState.SEARCHING || appState === AppState.ENRICHING || appState === AppState.PAUSED) && (
              <div className="bg-neutral-900 border border-neutral-800 p-4 rounded-lg space-y-3 animate-in fade-in slide-in-from-top-2">
                  <div className="flex items-center justify-between text-xs text-neutral-400 uppercase tracking-widest mb-2">
                      <span>Process Control</span>
                      <span className={`w-2 h-2 rounded-full ${appState === AppState.PAUSED ? 'bg-amber-500' : 'bg-teal-500 animate-pulse'}`}></span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                      {appState === AppState.PAUSED ? (
                          <button onClick={handleResume} className="bg-teal-900/30 hover:bg-teal-900/50 text-teal-400 border border-teal-900 rounded p-2 flex flex-col items-center justify-center transition-colors">
                              <Play className="w-4 h-4 mb-1" />
                              <span className="text-[10px]">Resume</span>
                          </button>
                      ) : (
                          <button onClick={handlePause} className="bg-amber-900/30 hover:bg-amber-900/50 text-amber-400 border border-amber-900 rounded p-2 flex flex-col items-center justify-center transition-colors">
                              <Pause className="w-4 h-4 mb-1" />
                              <span className="text-[10px]">Pause</span>
                          </button>
                      )}
                      
                      <button onClick={handleStop} className="bg-rose-900/30 hover:bg-rose-900/50 text-rose-400 border border-rose-900 rounded p-2 flex flex-col items-center justify-center transition-colors">
                          <Square className="w-4 h-4 mb-1 fill-current" />
                          <span className="text-[10px]">Stop</span>
                      </button>

                      <button onClick={handleExport} className="bg-neutral-800 hover:bg-neutral-700 text-neutral-300 border border-neutral-700 rounded p-2 flex flex-col items-center justify-center transition-colors">
                          <Save className="w-4 h-4 mb-1" />
                          <span className="text-[10px]">Export</span>
                      </button>
                  </div>
              </div>
          )}

          <Terminal logs={logs} />
          
          {appState === AppState.COMPLETE && leads.length > 0 && (
            <div className="bg-teal-900/10 border border-teal-900/30 p-4 rounded-lg flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-teal-400 uppercase tracking-wider">Operation Complete</p>
                <p className="text-[10px] text-teal-600/80">{leads.length} entities analyzed</p>
              </div>
              <button 
                onClick={handleExport}
                className="bg-teal-600 hover:bg-teal-500 text-white p-2 rounded-md transition-colors shadow-lg shadow-teal-900/20"
                title="Download Data"
              >
                <Download className="w-4 h-4" />
              </button>
            </div>
          )}

           {(!process.env.API_KEY) && (
             <div className="bg-rose-900/10 border border-rose-900/20 p-4 rounded-lg flex items-start space-x-3">
               <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
               <div className="text-xs text-rose-200/80">
                 <p className="font-medium text-rose-400">API Key Required</p>
               </div>
             </div>
           )}
        </div>

        <div className="p-4 border-t border-neutral-900 text-[10px] text-neutral-700 text-center uppercase tracking-widest">
          v2.0.1 • Deepmind Protocol
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-neutral-950 relative">
        {/* Subtle grid background */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.02] pointer-events-none"></div>
        
        {/* Top Panel - Analytics */}
        <div className="h-[280px] p-6 border-b border-neutral-900/80 z-10">
          <div className="flex items-center space-x-2 mb-4">
             <Activity className="w-4 h-4 text-teal-500" />
             <h2 className="text-sm font-medium text-neutral-400 uppercase tracking-widest">Live Intelligence</h2>
          </div>
          <Dashboard leads={leads} />
        </div>

        {/* Bottom Panel - Data */}
        <div className="flex-1 p-6 overflow-hidden flex flex-col z-10">
          <div className="flex items-center justify-between mb-4">
             <div className="flex items-center space-x-2">
                <Database className="w-4 h-4 text-teal-500" />
                <h2 className="text-sm font-medium text-neutral-400 uppercase tracking-widest">Entity Grid</h2>
             </div>
             {appState === AppState.ENRICHING && (
                <div className="flex items-center space-x-3">
                    <div className="h-1 w-24 bg-neutral-800 rounded-full overflow-hidden">
                        <div className="h-full bg-teal-500 transition-all duration-300" style={{ width: `${currentProgress}%` }}></div>
                    </div>
                    <span className="text-xs font-mono text-teal-500">{currentProgress}%</span>
                </div>
             )}
          </div>
          <div className="flex-1 relative">
            <LeadTable leads={leads} />
            {leads.length === 0 && appState === AppState.IDLE && (
              <div className="absolute inset-0 flex items-center justify-center flex-col">
                 <div className="w-20 h-20 bg-neutral-900 rounded-full flex items-center justify-center mb-6 border border-neutral-800 animate-pulse">
                    <Sparkles className="w-8 h-8 text-neutral-700" />
                 </div>
                 <p className="text-neutral-500 font-light text-lg">System Idle</p>
                 <p className="text-neutral-700 text-sm mt-2">Configure parameters to begin extraction</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;