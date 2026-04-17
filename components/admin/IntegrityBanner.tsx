"use client";

import React from 'react';
import { ShieldCheck, ShieldAlert, Activity, Database, Layout } from 'lucide-react';
import { MismatchReport } from '../../services/integrityService';

interface IntegrityBannerProps {
    report: MismatchReport;
    connectionStatus: 'ok' | 'recovering' | 'failed';
    role: string;
}

export const IntegrityBanner: React.FC<IntegrityBannerProps> = ({ report, connectionStatus, role }) => {
    const isCritical = report.severity === 'CRITICAL' || connectionStatus === 'failed';
    const isWarning = !report.isSync && report.severity !== 'CRITICAL';

    return (
        <div className={`w-full p-4 rounded-2xl mb-6 border transition-all animate-fadeIn flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm
            ${isCritical ? 'bg-red-50 border-red-200 text-red-700' : 
              isWarning ? 'bg-amber-50 border-amber-200 text-amber-700' : 
              'bg-emerald-50 border-emerald-200 text-emerald-700'}
        `}>
            <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl bg-white shadow-sm ${isCritical ? 'text-red-500' : isWarning ? 'text-amber-500' : 'text-emerald-500'}`}>
                    {isCritical ? <ShieldAlert size={20}/> : <ShieldCheck size={20}/>}
                </div>
                <div>
                    <h4 className="text-[10px] font-black uppercase tracking-widest leading-none mb-1">Integridade da Ponte de Dados</h4>
                    <p className="text-xs font-bold">
                        {isCritical ? 'Falha Crítica: Divergência severa detectada' : 
                         isWarning ? 'Alerta: Cache de Schema ou RLS dessincronizado' : 
                         'Sistemas Nominais: Dados e UI em total harmonia'}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-2 md:flex items-center gap-4 md:gap-8 w-full md:w-auto">
                <div className="flex items-center gap-2 opacity-80">
                    <Activity size={14}/>
                    <span className="text-[9px] font-black uppercase">Conexão: <span className="text-current">{connectionStatus.toUpperCase()}</span></span>
                </div>
                <div className="flex items-center gap-2 opacity-80">
                    <Database size={14}/>
                    <span className="text-[9px] font-black uppercase">Banco: <span className="font-mono">{report.dbCount}</span></span>
                </div>
                <div className="flex items-center gap-2 opacity-80">
                    <Layout size={14}/>
                    <span className="text-[9px] font-black uppercase">UI: <span className="font-mono">{report.uiCount}</span></span>
                </div>
                <div className="flex items-center gap-2 opacity-80">
                    <ShieldCheck size={14}/>
                    <span className="text-[9px] font-black uppercase">Permissão: <span className="text-current">{role}</span></span>
                </div>
            </div>
        </div>
    );
};