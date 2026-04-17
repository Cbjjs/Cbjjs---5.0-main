"use client";

import React, { useState, useEffect } from 'react';
import { Terminal, X, Copy, Check, Trash2, Bug } from 'lucide-react';
import { integrityService, IntegrityLog } from '../../services/integrityService';

export const IntegrityLogMonitor: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [logs, setLogs] = useState<IntegrityLog[]>([]);
    const [copiedId, setCopiedId] = useState<string | null>(null);

    useEffect(() => {
        return integrityService.subscribe(setLogs);
    }, []);

    const handleCopyAll = () => {
        navigator.clipboard.writeText(JSON.stringify(logs, null, 2));
        setCopiedId('all');
        setTimeout(() => setCopiedId(null), 2000);
    };

    const handleCopyIndividual = (log: IntegrityLog) => {
        navigator.clipboard.writeText(JSON.stringify(log, null, 2));
        setCopiedId(log.id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    if (!isOpen) {
        return (
            <button 
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 z-[1000] bg-slate-900 text-white p-4 rounded-2xl shadow-2xl hover:scale-110 active:scale-95 transition-all flex items-center gap-3 border border-white/10"
            >
                <Bug size={20} className="text-cbjjs-gold animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-widest">Monitor Admin</span>
                {logs.length > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold border-2 border-slate-900">
                        {logs.length}
                    </span>
                )}
            </button>
        );
    }

    return (
        <div className="fixed bottom-6 right-6 z-[1001] w-full max-w-lg bg-slate-900 rounded-[2rem] shadow-2xl border border-white/10 overflow-hidden animate-fadeIn flex flex-col max-h-[500px]">
            <div className="p-5 bg-slate-800/50 flex items-center justify-between border-b border-white/5">
                <div className="flex items-center gap-3">
                    <Terminal size={18} className="text-cbjjs-gold" />
                    <h3 className="text-xs font-black text-white uppercase tracking-widest">Execution Trace Monitor</h3>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={handleCopyAll} className="p-2 hover:bg-white/5 rounded-lg text-gray-400 transition-colors" title="Copiar Tudo">
                        {copiedId === 'all' ? <Check size={16} className="text-emerald-500"/> : <Copy size={16}/>}
                    </button>
                    <button onClick={() => integrityService.clearLogs()} className="p-2 hover:bg-white/5 rounded-lg text-gray-400 transition-colors" title="Limpar">
                        <Trash2 size={16}/>
                    </button>
                    <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/5 rounded-lg text-gray-400 transition-colors">
                        <X size={18}/>
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 font-mono text-[10px]">
                {logs.length === 0 ? (
                    <div className="py-10 text-center text-gray-600 italic">Aguardando transações...</div>
                ) : logs.map(log => (
                    <div key={log.id} className={`p-3 rounded-xl border transition-all ${
                        log.type === 'CRITICAL' ? 'bg-red-500/10 border-red-500/20 text-red-200' :
                        log.type === 'WARNING' ? 'bg-amber-500/10 border-amber-500/20 text-amber-200' :
                        log.type === 'SUCCESS' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-200' :
                        'bg-white/5 border-white/10 text-blue-200'
                    }`}>
                        <div className="flex justify-between items-start mb-2">
                            <span className="font-black">[{log.timestamp}] {log.label}</span>
                            <button onClick={() => handleCopyIndividual(log)} className="opacity-40 hover:opacity-100 transition-opacity">
                                {copiedId === log.id ? <Check size={12}/> : <Copy size={12}/>}
                            </button>
                        </div>
                        {log.diagnosis && (
                            <div className="mb-2 p-2 bg-black/40 rounded-lg text-[9px] font-bold border-l-2 border-current">
                                DIAGNÓSTICO: {log.diagnosis}
                            </div>
                        )}
                        <pre className="overflow-x-auto whitespace-pre-wrap opacity-60">
                            {JSON.stringify(log.payload, null, 2)}
                        </pre>
                    </div>
                ))}
            </div>
        </div>
    );
};