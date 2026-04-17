"use client";

import { supabase } from '../lib/supabase';

export interface IntegrityLog {
    id: string;
    timestamp: string;
    type: 'INFO' | 'WARNING' | 'CRITICAL' | 'SUCCESS';
    label: string;
    payload: any;
    diagnosis?: string;
}

export interface MismatchReport {
    dbCount: number;
    uiCount: number;
    isSync: boolean;
    severity: 'LOW' | 'HIGH' | 'CRITICAL';
}

class IntegrityService {
    private logs: IntegrityLog[] = [];
    private listeners: ((logs: IntegrityLog[]) => void)[] = [];

    private addLog(log: Omit<IntegrityLog, 'id' | 'timestamp'>) {
        const newLog: IntegrityLog = {
            ...log,
            id: Math.random().toString(36).substring(2, 9),
            timestamp: new Date().toLocaleTimeString()
        };
        this.logs = [newLog, ...this.logs].slice(0, 50);
        this.listeners.forEach(l => l(this.logs));
    }

    subscribe(callback: (logs: IntegrityLog[]) => void) {
        this.listeners.push(callback);
        callback(this.logs);
        return () => { this.listeners = this.listeners.filter(l => l !== callback); };
    }

    /**
     * Rastreia uma ação de API e joga no monitor
     */
    traceAction(label: string, payload: any, type: 'INFO' | 'SUCCESS' | 'CRITICAL' = 'INFO') {
        this.addLog({ type, label, payload });
    }

    /**
     * Varredura Profunda (Deep Scan)
     */
    async deepScanEntity(entityId: string, tableName: string) {
        this.addLog({ type: 'INFO', label: 'Iniciando Deep Scan de Exclusão', payload: { entityId, tableName } });

        try {
            const search1 = await supabase.from(tableName).select('id').eq('id', entityId).maybeSingle();
            const { data: deps } = await supabase.from('dependents').select('id').eq('parent_id', entityId);

            const results = {
                existsInDB: !!search1.data,
                hasActiveDependents: (deps?.length || 0) > 0,
                rlsError: !!search1.error && (search1.error.code === '42501' || search1.error.status === 403)
            };

            let diagnosis = "Análise concluída.";
            let type: 'SUCCESS' | 'WARNING' | 'CRITICAL' = 'SUCCESS';

            if (results.rlsError) {
                diagnosis = "BLOQUEIO DE PERMISSÃO (RLS): Sua conta Admin não tem permissão para esta linha.";
                type = 'CRITICAL';
            } else if (results.hasActiveDependents) {
                diagnosis = "VIOLAÇÃO DE VÍNCULO: Usuário possui filhos. A função tentará limpá-los.";
                type = 'WARNING';
            }

            this.addLog({ type, label: 'Resultado do Diagnóstico', payload: results, diagnosis });
            return { results, diagnosis };
        } catch (err: any) {
            this.addLog({ type: 'CRITICAL', label: 'Falha Técnica no Scan', payload: err });
            return { diagnosis: "Erro no scan." };
        }
    }

    generateMismatchReport(dbCount: number, uiCount: number): MismatchReport {
        const isSync = dbCount > 0 ? (uiCount > 0) : (uiCount === 0);
        return { dbCount, uiCount, isSync, severity: (dbCount > 0 && uiCount === 0) ? 'CRITICAL' : 'LOW' };
    }

    clearLogs() {
        this.logs = [];
        this.listeners.forEach(l => l(this.logs));
    }
}

export const integrityService = new IntegrityService();