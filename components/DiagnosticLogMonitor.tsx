import React, { useState, useEffect, useMemo } from 'react';
import { Terminal, X, Copy, Trash2, Bug, ChevronDown, ChevronUp, CheckCircle2 } from 'lucide-react';
import { probe, DiagnosticLog } from '../utils/diagnosticProbe';

export const DiagnosticLogMonitor: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [allLogs, setAllLogs] = useState<DiagnosticLog[]>([]);

    useEffect(() => {
        return probe.subscribe(setAllLogs);
    }, []);

    // Filtra para exibir apenas o que é RECENTE e ATIVO nesta sessão
    const activeLogs = useMemo(() => {
        return allLogs.filter(l => l.status === 'ACTIVE').slice(0, 8);
    }, [allLogs]);

    const copyAll = () => {
        navigator.clipboard.writeText(JSON.stringify(activeLogs, null, 2));
        alert('Logs copiados!');
    };

    if (!isOpen) {
        return (
            <button 
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 z-[9999] bg-slate-900 text-white p-4 rounded-full shadow-2xl hover:scale-110 transition-all border border-white/20"
            >
                <Bug size={24} />
                {activeLogs.some(l => l.level === 'CRITICAL' || l.level === 'ERROR') && (
                    <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 rounded-full animate-ping"></span>
                )}
            </button>
        );
    }

    return (
        <div className={`fixed right-6 bottom-6 z-[9999] w-full max-w-sm md:max-w-md bg-slate-950 rounded-2xl shadow-2xl border border-slate-800 flex flex-col transition-all overflow-hidden ${isMinimized ? 'h-14' : 'h-[400px]'}`}>
            <div className="p-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Terminal size={16} className="text-blue-400" />
                    <h3 className="text-[10px] font-black uppercase text-white tracking-widest">Monitor de Integridade</h3>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={() => setIsMinimized(!isMinimized)} className="p-1 text-slate-400 hover:text-white">
                        {isMinimized ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
                    </button>
                    <button onClick={() => setIsOpen(false)} className="p-1 text-slate-400 hover:text-red-400">
                        <X size={16} />
                    </button>
                </div>
            </div>

            {!isMinimized && (
                <>
                    <div className="flex-1 overflow-y-auto p-4 space-y-3 font-mono">
                        {activeLogs.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-slate-600 gap-3 opacity-50">
                                <CheckCircle2 size={32} />
                                <p className="text-[9px] font-black uppercase tracking-widest">Nenhum erro ativo detectado</p>
                            </div>
                        ) : (
                            activeLogs.map((log) => (
                                <div key={log.id} className="text-[10px] border-l-2 pl-3 py-2 bg-slate-900/50 rounded-r-lg" style={{ borderColor: log.level === 'CRITICAL' ? '#ef4444' : log.level === 'ERROR' ? '#f97316' : '#3b82f6' }}>
                                    <div className="flex justify-between items-start mb-1">
                                        <span className="text-slate-500 text-[8px]">{log.timestamp}</span>
                                        <span className={`text-[8px] font-black px-1 rounded ${log.level === 'CRITICAL' ? 'bg-red-500/20 text-red-500' : 'bg-blue-500/20 text-blue-500'}`}>{log.level}</span>
                                    </div>
                                    <p className={log.level === 'CRITICAL' ? 'text-red-400 font-bold' : 'text-slate-200'}>{log.message}</p>
                                    {log.diagnosis && (
                                        <div className="mt-2 p-1.5 bg-red-950/20 border border-red-900/30 rounded text-[9px] text-red-300 font-bold uppercase leading-tight">
                                            {log.diagnosis}
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>

                    <div className="p-3 bg-slate-900 border-t border-slate-800 flex gap-2">
                        <button onClick={copyAll} className="flex-1 py-2 bg-slate-800 text-white rounded-lg text-[9px] font-black uppercase hover:bg-slate-700 transition-colors">
                            Copiar Diagnóstico
                        </button>
                        <button onClick={() => probe.clear()} className="p-2 bg-slate-800 text-slate-400 rounded-lg hover:text-red-400" title="Limpar Logs">
                            <Trash2 size={14}/>
                        </button>
                    </div>
                </>
            )}
        </div>
    );
};