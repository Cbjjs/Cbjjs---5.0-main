import React, { useState, useEffect } from 'react';
import { ShieldCheck, ShieldAlert, Activity, Database, Layout } from 'lucide-react';
import { supabase } from '../lib/supabase';

export const DiagnosticIntegrityBanner: React.FC<{ uiCount: number }> = ({ uiCount }) => {
    const [dbStatus, setDbStatus] = useState({ connection: 'Checking', dbCount: 0, healthy: true });

    useEffect(() => {
        const checkStatus = async () => {
            const { count, error } = await supabase.from('academies').select('*', { count: 'exact', head: true });
            
            setDbStatus({
                connection: error ? 'Disconnected' : 'Online',
                dbCount: count || 0,
                healthy: !error && (count === uiCount || uiCount === 0)
            });
        };
        checkStatus();
        const interval = setInterval(checkStatus, 5000);
        return () => clearInterval(interval);
    }, [uiCount]);

    const isBridgeBroken = dbStatus.dbCount > 0 && uiCount === 0;

    return (
        <div className={`w-full p-3 flex items-center justify-between border-b transition-colors animate-fadeIn ${isBridgeBroken ? 'bg-red-600 text-white' : dbStatus.healthy ? 'bg-green-50 dark:bg-green-900/20 text-green-700' : 'bg-amber-50 text-amber-700'}`}>
            <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                    {isBridgeBroken ? <ShieldAlert size={18} className="animate-pulse" /> : <ShieldCheck size={18} />}
                    <span className="text-[10px] font-black uppercase tracking-widest">
                        {isBridgeBroken ? 'PONTE DE DADOS QUEBRADA' : 'Integridade da Ponte'}
                    </span>
                </div>
                
                <div className="hidden md:flex items-center gap-4 text-[9px] font-bold uppercase opacity-80">
                    <span className="flex items-center gap-1"><Activity size={12}/> Net: {dbStatus.connection}</span>
                    <span className="flex items-center gap-1"><Database size={12}/> Banco: {dbStatus.dbCount}</span>
                    <span className="flex items-center gap-1"><Layout size={12}/> UI: {uiCount}</span>
                </div>
            </div>

            {isBridgeBroken && (
                <div className="animate-bounce bg-white text-red-600 px-3 py-1 rounded-full text-[9px] font-black uppercase">
                    ALERTA CRÍTICO: Registros invisíveis na UI
                </div>
            )}
        </div>
    );
};