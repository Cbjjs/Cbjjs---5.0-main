"use client";

import React, { useState } from 'react';
import { useIntegrity } from '../../context/IntegrityContext';
import { Termianl, X, Copy, ChevronDown, ChevronUp, Database, AlertCircle, CheckCircle2, History } from 'lucide-react';

export const IntegrityLogMonitor: React.FC = () => {
    const { logs, clearLogs } = useIntegrity();
    const [isOpen, setIsOpen] = useState(false);
    const [expandedLog, setExpandedLog] = useState<string | null>(null);

    const handleCopyAll = () => {
        navigator.clipboard.writeText(JSON.stringify(logs, null, 2));
        alert('Todos os logs copiados (JSON)');
    };

    const handleCopyLine = (log: any) => {
        navigator.clipboard.writeText(JSON.stringify(log, null, 2));
    };

    if (!isOpen) {
        return (
            <button 
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 left-6 z-[10005] bg-slate-900 text-white p-3 rounded-2xl shadow-2xl border border-slate-700 hover:scale-110 transition-all active:scale-95 group"
            >
                <div className="relative">
                   <History size={24}/>
                   {logs.filter(l => l.status === 'error').length > 0 && (
                       <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-slate-900"></div>
                   )}
                </div>
            </button>
        );
    }

    return (
        <div className="fixed bottom-6 left-6 z-[10005] w-[400px] max-h-[600px] bg-slate-900 border border-slate-700 rounded-[2rem] shadow-2xl flex flex-col overflow-hidden animate-fadeIn">
            <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-950/50">
                <div className="flex items-center gap-3">
                    <History size={18} className="text-cbjjs-blue" />
                    <h3 className="text-xs font-black text-white uppercase tracking-widest">Monitor de Execução</h3>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={handleCopyAll} className="p-1.5 text-slate-400 hover:text-white transition-colors" title="Copiar Tudo">
                        <Copy size={16}/>
                    </button>
                    <button onClick={() => setIsOpen(false)} className="p-1.5 text-slate-400 hover:text-white transition-colors">
                        <X size={18}/>
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-hide">
                {logs.length === 0 ? (
                    <div className="py-20 text-center text-slate-600 italic text-xs">Nenhuma operação rastreada.</div>
                ) : logs.map(log => (
                    <div key={log.id} className={`p-3 rounded-xl border ${
                        log.status === 'error' ? 'bg-red-500/10 border-red-500/20' : 
                        log.status === 'pending' ? 'bg-blue-500/10 border-blue-500/20 animate-pulse' : 'bg-slate-800/50 border-slate-700'
                    }`}>
                        <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                                {log.status === 'error' ? <AlertCircle size={14} className="text-red-500 shrink-0"/> : 
                                 log.status === 'success' ? <CheckCircle2 size={14} className="text-emerald-500 shrink-0"/> : 
                                 <Database size={14} className="text-blue-400 shrink-0"/>}
                                <span className="text-[10px] font-black text-slate-300 uppercase truncate">{log.action}</span>
                            </div>
                            <button onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)} className="text-slate-500">
                                {expandedLog === log.id ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}
                            </button>
                        </div>

                        {expandedLog === log.id && (
                            <div className="mt-3 space-y-3 animate-fadeIn">
                                <div className="space-y-1">
                                    <p className="text-[8px] font-black text-slate-500 uppercase">Payload Enviado:</p>
                                    <pre className="text-[9px] bg-black/50 p-2 rounded-lg text-blue-300 overflow-x-auto">
                                        {JSON.stringify(log.payload, null, 2)}
                                    </pre>
                                </div>
                                {log.response && (
                                    <div className="space-y-1">
                                        <p className="text-[8px] font-black text-slate-500 uppercase">Resposta do Banco:</p>
                                        <pre className={`text-[9px] p-2 rounded-lg overflow-x-auto ${log.status === 'error' ? 'bg-red-950/30 text-red-300' : 'bg-black/50 text-emerald-300'}`}>
                                            {JSON.stringify(log.response, null, 2)}
                                        </pre>
                                    </div>
                                )}
                                {log.report && (
                                    <div className={`p-2 rounded-lg text-[9px] font-bold ${log.report.isValid ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                                        DIAGNÓSTICO PROBE: {log.report.reason || 'SISTEMA ÍNTEGRO'}
                                    </div>
                                )}
                                <button 
                                    onClick={() => handleCopyLine(log)}
                                    className="w-full py-1.5 bg-slate-700 text-[9px] font-black uppercase text-slate-300 rounded-lg hover:bg-slate-600 transition-colors"
                                >
                                    Copiar Debug JSON
                                </button>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <div className="p-4 bg-slate-950/50 border-t border-slate-800">
                <button onClick={clearLogs} className="w-full py-2 text-[9px] font-black text-slate-500 uppercase tracking-widest hover:text-white transition-colors">Limpar Histórico</button>
            </div>
        </div>
    );
};