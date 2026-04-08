import React, { useState, useEffect } from 'react';
import { Terminal, X, Copy, Trash2, Bug, ChevronDown, ChevronUp } from 'lucide-react';
import { probe, DiagnosticLog } from '../utils/diagnosticProbe';

export const DiagnosticLogMonitor: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [logs, setLogs] = useState<DiagnosticLog[]>([]);

    useEffect(() => {
        return probe.subscribe(setLogs);
    }, []);

    const copyAll = () => {
        navigator.clipboard.writeText(JSON.stringify(logs, null, 2));
        alert('Copiado para o clipboard!');
    };

    if (!isOpen) {
        return (
            <button 
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 z-[9999] bg-slate-900 text-white p-4 rounded-full shadow-2xl hover:scale-110 transition-all border border-white/20"
            >
                <Bug size={24} />
                {logs.some(l => l.level === 'CRITICAL') && (
                    <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 rounded-full animate-ping"></span>
                )}
            </button>
        );
    }

    return (
        <div className={`fixed right-6 bottom-6 z-[9999] w-full max-w-lg bg-slate-950 rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-slate-800 flex flex-col transition-all overflow-hidden ${isMinimized ? 'h-14' : 'h-[500px]'}`}>
            <div className="p-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Terminal size={18} className="text-blue-400" />
                    <h3 className="text-xs font-black uppercase text-white tracking-widest">Integrity Log Monitor</h3>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={() => setIsMinimized(!isMinimized)} className="p-1.5 text-slate-400 hover:text-white">
                        {isMinimized ? <ChevronUp size={18}/> : <ChevronDown size={18}/>}
                    </button>
                    <button onClick={() => setIsOpen(false)} className="p-1.5 text-slate-400 hover:text-red-400">
                        <X size={18} />
                    </button>
                </div>
            </div>

            {!isMinimized && (
                <>
                    <div className="flex-1 overflow-y-auto p-4 space-y-3 font-mono">
                        {logs.length === 0 && <p className="text-slate-600 text-[10px] text-center mt-10">Aguardando eventos do sistema...</p>}
                        {logs.map((log, i) => (
                            <div key={i} className="text-[10px] border-l-2 pl-3 py-1 bg-slate-900/50 rounded-r-lg group relative" style={{ borderColor: log.level === 'CRITICAL' ? '#ef4444' : log.level === 'ERROR' ? '#f97316' : '#3b82f6' }}>
                                <div className="flex justify-between items-start mb-1">
                                    <span className="text-slate-500">{log.timestamp}</span>
                                    <button 
                                        onClick={() => navigator.clipboard.writeText(JSON.stringify(log, null, 2))}
                                        className="opacity-0 group-hover:opacity-100 p-1 bg-slate-800 rounded text-slate-400 hover:text-white transition-opacity"
                                    >
                                        <Copy size={12} />
                                    </button>
                                </div>
                                <p className={log.level === 'CRITICAL' ? 'text-red-400 font-bold' : 'text-slate-200'}>{log.message}</p>
                                {log.diagnosis && (
                                    <div className="mt-2 p-2 bg-red-950/30 border border-red-900/50 rounded text-red-300 font-bold uppercase tracking-tighter">
                                        Diagnóstico: {log.diagnosis}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    <div className="p-4 bg-slate-900 border-t border-slate-800 flex gap-3">
                        <button onClick={copyAll} className="flex-1 py-2.5 bg-slate-800 text-white rounded-lg text-[10px] font-black uppercase flex items-center justify-center gap-2 hover:bg-slate-700">
                            <Copy size={14}/> Copiar Tudo (JSON)
                        </button>
                        <button onClick={() => probe.clear()} className="px-4 py-2.5 bg-slate-800 text-slate-400 rounded-lg hover:text-red-400">
                            <Trash2 size={16}/>
                        </button>
                    </div>
                </>
            )}
        </div>
    );
};