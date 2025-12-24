import React, { useEffect, useRef } from 'react';
import { LogEntry } from '../types';
import { Terminal as TerminalIcon } from 'lucide-react';

interface TerminalProps {
  logs: LogEntry[];
}

export const Terminal: React.FC<TerminalProps> = ({ logs }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="bg-neutral-900 rounded-lg border border-neutral-800 flex flex-col h-[250px] font-mono">
      <div className="bg-neutral-900 px-3 py-2 rounded-t-lg flex items-center space-x-2 border-b border-neutral-800">
        <div className="flex space-x-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-neutral-700"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-neutral-700"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-neutral-700"></div>
        </div>
        <span className="text-[10px] text-neutral-500 ml-2">sys_log</span>
      </div>
      <div 
        ref={scrollRef}
        className="flex-1 p-3 overflow-y-auto text-[10px] space-y-1.5 scrollbar-hide"
      >
        {logs.length === 0 && (
          <div className="text-neutral-600">_waiting for input</div>
        )}
        {logs.map((log) => (
          <div key={log.id} className="flex items-start space-x-2">
            <span className="text-neutral-600 opacity-50">
              {new Date(log.timestamp).toLocaleTimeString([], { hour12: false, minute:'2-digit', second:'2-digit' })}
            </span>
            <span className={`
              ${log.type === 'error' ? 'text-rose-400' : ''}
              ${log.type === 'success' ? 'text-teal-400' : ''}
              ${log.type === 'warning' ? 'text-amber-400' : ''}
              ${log.type === 'dork' ? 'text-indigo-400' : ''}
              ${log.type === 'info' ? 'text-neutral-400' : ''}
            `}>
              {log.type === 'dork' && <span className="text-indigo-500 mr-1">$</span>}
              {log.message}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};