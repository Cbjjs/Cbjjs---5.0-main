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
     * Realiza uma varredura profunda em uma entidade para detectar falhas de ponte.
     */
    async deepScanEntity(entityId: string, tableName: string) {
        this.addLog({ type: 'INFO', label: 'Iniciando Deep Scan', payload: { entityId, tableName } });

        try {
            // 1. Busca Direta (Tipo UUID/PK)
            const search1 = await supabase.from(tableName).select('*').eq('id', entityId).maybeSingle();
            
            // 2. Busca por Filtro Bruto (String Casting)
            const search2 = await supabase.from(tableName).select('*').filter('id', 'eq', entityId);

            // 3. Teste de RLS (Tenta ler via RPC ou count público se houver)
            const { count: rlsCheck } = await supabase.from(tableName).select('*', { count: 'exact', head: true });

            const results = {
                directMatch: !!search1.data,
                castMatch: (search2.data?.length || 0) > 0,
                rlsError: !!search1.error && search1.error.code === '42501',
                schemaError: !!search1.error && search1.error.code === 'PGRST202'
            };

            let diagnosis = "Integridade OK";
            let type: 'SUCCESS' | 'CRITICAL' = 'SUCCESS';

            if (results.rlsError) {
                diagnosis = "BLOQUEIO RLS: O banco possui o dado, mas sua permissão de Admin não alcança esta linha.";
                type = 'CRITICAL';
            } else if (!results.directMatch && results.castMatch) {
                diagnosis = "FALHA DE CASTING: O dado existe como string, mas falha na busca por UUID.";
                type = 'CRITICAL';
            } else if (!results.directMatch) {
                diagnosis = "DADO INEXISTENTE: O registro não foi encontrado no banco de dados.";
                type = 'WARNING';
            }

            this.addLog({ type, label: 'Resultado do Diagnóstico', payload: results, diagnosis });
            return { results, diagnosis };
        } catch (err: any) {
            this.addLog({ type: 'CRITICAL', label: 'Erro na Varredura', payload: err });
            return { diagnosis: "Erro sistêmico durante varredura" };
        }
    }

    /**
     * Compara contagem do banco vs o que a UI está exibindo
     */
    generateMismatchReport(dbCount: number, uiCount: number): MismatchReport {
        const isSync = dbCount === uiCount;
        const report: MismatchReport = {
            dbCount,
            uiCount,
            isSync,
            severity: !isSync && dbCount > 0 && uiCount === 0 ? 'CRITICAL' : (!isSync ? 'HIGH' : 'LOW')
        };

        if (!isSync) {
            this.addLog({ 
                type: report.severity === 'CRITICAL' ? 'CRITICAL' : 'WARNING', 
                label: 'Divergência Detectada', 
                payload: report,
                diagnosis: report.severity === 'CRITICAL' ? 'PONTE QUEBRADA: O banco contém dados que o RLS ou Filtros estão escondendo totalmente da UI.' : 'Diferença de contagem entre banco e cache local.'
            });
        }

        return report;
    }

    clearLogs() {
        this.logs = [];
        this.listeners.forEach(l => l(this.logs));
    }
}

export const integrityService = new IntegrityService();