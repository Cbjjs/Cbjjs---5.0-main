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
     * Varredura Profunda (Deep Scan)
     * Acionada no momento da exclusão para detectar a causa da falha.
     */
    async deepScanEntity(entityId: string, tableName: string) {
        this.addLog({ type: 'INFO', label: 'Iniciando Deep Scan de Exclusão', payload: { entityId, tableName } });

        try {
            // 1. Busca Direta (UUID)
            const search1 = await supabase.from(tableName).select('id, full_name, email').eq('id', entityId).maybeSingle();
            
            // 2. Busca por Filtro Bruto (String Casting)
            const search2 = await supabase.from(tableName).select('id').filter('id', 'eq', entityId);

            // 3. Verificação de Vínculos (Dependents)
            const { data: deps } = await supabase.from('dependents').select('id').eq('parent_id', entityId);

            const results = {
                existsInDB: !!search1.data,
                foundViaStringFilter: (search2.data?.length || 0) > 0,
                hasActiveDependents: (deps?.length || 0) > 0,
                rlsError: !!search1.error && (search1.error.code === '42501' || search1.error.status === 403),
                authSession: !!(await supabase.auth.getSession()).data.session
            };

            let diagnosis = "Análise concluída.";
            let type: 'SUCCESS' | 'WARNING' | 'CRITICAL' = 'SUCCESS';

            if (results.rlsError) {
                diagnosis = "BLOQUEIO DE PERMISSÃO (RLS): O registro existe, mas sua conta Admin não tem permissão para deletar/ver esta linha específica.";
                type = 'CRITICAL';
            } else if (results.hasActiveDependents) {
                diagnosis = "VIOLAÇÃO DE VÍNCULO: O usuário possui filhos/dependentes cadastrados. A exclusão via API falha para proteger a integridade dos filhos.";
                type = 'CRITICAL';
            } else if (!results.existsInDB && results.foundViaStringFilter) {
                diagnosis = "ERRO DE CASTING: O ID existe mas o banco não o reconhece como UUID válido na consulta direta.";
                type = 'CRITICAL';
            } else if (!results.existsInDB) {
                diagnosis = "REGISTRO FANTASMA: O usuário aparece na lista mas não foi encontrado no banco (Cache dessincronizado).";
                type = 'WARNING';
            }

            this.addLog({ type, label: 'Resultado do Diagnóstico', payload: results, diagnosis });
            return { results, diagnosis };
        } catch (err: any) {
            this.addLog({ type: 'CRITICAL', label: 'Falha Técnica no Scan', payload: err });
            return { diagnosis: "Erro ao tentar diagnosticar a falha." };
        }
    }

    generateMismatchReport(dbCount: number, uiCount: number): MismatchReport {
        // Agora considera paginação (se UI tem 12 e DB tem > 12, está sincronizado)
        const isSync = dbCount > 0 ? (uiCount > 0) : (uiCount === 0);
        
        const report: MismatchReport = {
            dbCount,
            uiCount,
            isSync,
            severity: (dbCount > 0 && uiCount === 0) ? 'CRITICAL' : 'LOW'
        };

        return report;
    }

    clearLogs() {
        this.logs = [];
        this.listeners.forEach(l => l(this.logs));
    }
}

export const integrityService = new IntegrityService();