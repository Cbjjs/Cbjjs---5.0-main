import { supabase } from '../lib/supabase';

export type DiagnosticLog = {
    timestamp: string;
    level: 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL';
    message: string;
    payload?: any;
    diagnosis?: string;
};

const STORAGE_KEY = 'cbjjs_diagnostic_logs';

class DataBridgeIntegrityProbe {
    private logs: DiagnosticLog[] = [];
    private listeners: ((logs: DiagnosticLog[]) => void)[] = [];

    constructor() {
        // Recupera logs anteriores do LocalStorage (Persistência pós-crash)
        if (typeof window !== 'undefined') {
            try {
                const saved = localStorage.getItem(STORAGE_KEY);
                if (saved) {
                    this.logs = JSON.parse(saved);
                }
            } catch (e) {
                console.warn("Falha ao recuperar logs do storage", e);
            }

            // Captura automática de erros fatais
            window.onerror = (message, source, lineno, colno, error) => {
                this.addLog('CRITICAL', `ERRO FATAL (Render): ${message}`, { 
                    source, 
                    lineno, 
                    stack: error?.stack 
                });
            };
            
            window.onunhandledrejection = (event) => {
                this.addLog('ERROR', `Promessa Rejeitada (Async): ${event.reason?.message || event.reason}`, { 
                    reason: event.reason 
                });
            };
        }
    }

    private saveToStorage() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(this.logs));
        } catch (e) {
            console.warn("Storage cheio ou inacessível", e);
        }
    }

    addLog(level: DiagnosticLog['level'], message: string, payload?: any) {
        const log: DiagnosticLog = {
            timestamp: new Date().toLocaleString('pt-BR'),
            level,
            message,
            payload,
            diagnosis: this.diagnose(level, message, payload)
        };
        this.logs = [log, ...this.logs].slice(0, 50); // Mantém os últimos 50 eventos
        this.saveToStorage();
        this.notify();
        console.log(`[PROBE][${level}] ${message}`, payload);
    }

    private diagnose(level: string, message: string, payload: any): string | undefined {
        if (level === 'ERROR' || level === 'CRITICAL') {
            const msg = (message + JSON.stringify(payload)).toLowerCase();
            if (msg.includes('uuid') || payload?.code === '22p02') return 'Falha de ID: O sistema tentou enviar um ID mal formatado.';
            if (payload?.code === '42501' || msg.includes('permission denied')) return 'RLS Block: Você não tem permissão no Banco de Dados para excluir esta linha.';
            if (msg.includes('foreign key') || msg.includes('violates foreign key')) return 'Integridade: Existem ATLETAS vinculados a esta academia. Remova-os primeiro.';
            if (msg.includes('reading') || msg.includes('undefined') || msg.includes('null')) return 'Crash de Interface: O código tentou ler dados de uma academia que não existe mais no estado da tela.';
            return 'Erro de Execução Crítico.';
        }
        return undefined;
    }

    subscribe(listener: (logs: DiagnosticLog[]) => void) {
        this.listeners.push(listener);
        listener(this.logs);
        return () => { this.listeners = this.listeners.filter(l => l !== listener); };
    }

    private notify() {
        this.listeners.forEach(l => l([...this.logs]));
    }

    async deepScan(entityTable: string, id: string) {
        this.addLog('INFO', `Varredura Profunda iniciada para ID: ${id}`);
        try {
            const [direct, raw] = await Promise.all([
                supabase.from(entityTable).select('id').eq('id', id).maybeSingle(),
                supabase.from(entityTable).select('*').filter('id', 'eq', id)
            ]);

            const mismatch = {
                id_exists: !!direct.data || (raw.data && (raw.data as any).length > 0),
                raw_data: raw.data
            };

            this.addLog('INFO', mismatch.id_exists ? 'Registro localizado no DB.' : 'Registro NÃO ENCONTRADO no DB.', mismatch);
            return mismatch;
        } catch (err: any) {
            this.addLog('ERROR', `Falha no Scan: ${err.message}`, err);
            return null;
        }
    }

    clear() {
        this.logs = [];
        localStorage.removeItem(STORAGE_KEY);
        this.notify();
    }
}

export const probe = new DataBridgeIntegrityProbe();