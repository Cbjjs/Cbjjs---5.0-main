import { supabase } from '../lib/supabase';

export type DiagnosticLog = {
    timestamp: string;
    level: 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL';
    message: string;
    payload?: any;
    diagnosis?: string;
};

class DataBridgeIntegrityProbe {
    private logs: DiagnosticLog[] = [];
    private listeners: ((logs: DiagnosticLog[]) => void)[] = [];

    constructor() {
        // Captura automática de erros não tratados que causam a tela branca
        if (typeof window !== 'undefined') {
            window.onerror = (message, source, lineno, colno, error) => {
                this.addLog('CRITICAL', `ERRO FATAL (Global): ${message}`, { source, lineno, colno, stack: error?.stack });
            };
            window.onunhandledrejection = (event) => {
                this.addLog('ERROR', `Promessa Rejeitada (Async): ${event.reason?.message || event.reason}`, { reason: event.reason });
            };
        }
    }

    addLog(level: DiagnosticLog['level'], message: string, payload?: any) {
        const log: DiagnosticLog = {
            timestamp: new Date().toLocaleTimeString(),
            level,
            message,
            payload,
            diagnosis: this.diagnose(level, message, payload)
        };
        this.logs = [log, ...this.logs].slice(0, 100);
        this.notify();
        console.log(`[PROBE][${level}] ${message}`, payload);
    }

    private diagnose(level: string, message: string, payload: any): string | undefined {
        if (level === 'ERROR' || level === 'CRITICAL') {
            if (message.includes('UUID') || (payload?.code === '22P02')) return 'Falha de Casting: O ID enviado não é um UUID válido no banco.';
            if (payload?.code === '42501') return 'RLS Block: O usuário logado não tem permissão de DELETE nesta linha.';
            if (payload?.message?.includes('foreign key')) return 'Integridade Referencial: Existem atletas vinculados a esta academia.';
            if (message.includes('Render') || message.includes('Component')) return 'Crash de Renderização: O código da interface tentou acessar uma propriedade inexistente após a ação.';
            return 'Erro Desconhecido do Postgres ou Runtime.';
        }
        return undefined;
    }

    subscribe(listener: (logs: DiagnosticLog[]) => void) {
        this.listeners.push(listener);
        listener(this.logs);
        return () => { this.listeners = this.listeners.filter(l => l !== listener); };
    }

    private notify() {
        this.listeners.forEach(l => l(this.logs));
    }

    async deepScan(entityTable: string, id: string) {
        this.addLog('INFO', `Iniciando Deep Scan na tabela ${entityTable} para ID: ${id}`);

        try {
            const [direct, nested, raw] = await Promise.all([
                supabase.from(entityTable).select('id').eq('id', id).maybeSingle(),
                supabase.from(entityTable).select('id').eq('id', id).limit(1),
                supabase.from(entityTable).select('*').filter('id', 'eq', id)
            ]);

            const mismatch = {
                direct: !!direct.data,
                nested: !!nested.data,
                raw: !!raw.data && (raw.data as any).length > 0,
                dbCount: (raw.data as any)?.length || 0
            };

            if (mismatch.dbCount > 0 && !mismatch.direct) {
                this.addLog('CRITICAL', 'Ponte de Dados Quebrada: Registro existe no banco mas falha na busca direta.', mismatch);
            } else {
                this.addLog('INFO', 'Scan concluído. Registro localizado.', mismatch);
            }
            return mismatch;
        } catch (err: any) {
            this.addLog('ERROR', `Falha ao executar Deep Scan: ${err.message}`, err);
            return null;
        }
    }

    getLogs() { return this.logs; }
    clear() { this.logs = []; this.notify(); }
}

export const probe = new DataBridgeIntegrityProbe();