"use client";

import React from 'react';
import { useIntegrity } from '../../context/IntegrityContext';
import { ShieldCheck, ShieldAlert, Activity, Database, Layout } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const IntegrityBanner: React.FC = () => {
    const { lastReport, isProbeActive, logs } = useIntegrity();
    const { user } = useAuth();

    if (!user || user.role !== 'ADMIN') return null;

    const isHealthy = !lastReport || lastReport.isValid;
    const pendingLogs = logs.filter(l => l.status === 'pending').length;

    return (
        <div className={`w-full py-2 px-6 flex items-center justify-between transition-colors duration-500 z-[9999] border-b ${
            isHealthy ? 'bg-emerald-600 text-white border-emerald-500' : 'bg-rose-600 text-white border-rose-500 animate-pulse'
        }`}>
            <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                    {isHealthy ? <ShieldCheck size={16}/> : <ShieldAlert size={16}/>}
                    <span className="text-[10px] font-black uppercase tracking-widest">
                        {isHealthy ? 'Ponte de Dados: Íntegra' : `ALERTA: ${lastReport?.reason}`}
                    </span>
                </div>

                <div className="hidden md:flex items-center gap-4 text-[9px] font-bold uppercase opacity-80">
                    <div className="flex items-center gap-1.5 border-l border-white/20 pl-4">
                        <Database size={12}/> DB: {isHealthy ? 'OK' : 'FAIL'}
                    </div>
                    <div className="flex items-center gap-1.5 border-l border-white/20 pl-4">
                        <Layout size={12}/> UI: {isHealthy ? 'SINCRONIZADA' : 'MISMATCH'}
                    </div>
                    <div className="flex items-center gap-1.5 border-l border-white/20 pl-4">
                        <Activity size={12}/> SONDAS ATIVAS: {isProbeActive ? 'PROCESSANDO...' : 'AGUARDANDO'}
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-4">
                {pendingLogs > 0 && (
                    <span className="bg-white/20 px-2 py-0.5 rounded text-[9px] font-black">
                        {pendingLogs} OPS EM CURSO
                    </span>
                )}
                <div className="text-[9px] font-black bg-black/20 px-2 py-1 rounded">
                    PROBE v1.0
                </div>
            </div>
        </div>
    );
};