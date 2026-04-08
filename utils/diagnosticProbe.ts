import { supabase } from '../lib/supabase';

export type DiagnosticLog = {
    id: string;
    timestamp: string;
    level: 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL';
    message: string;
    payload?: any;
    diagnosis?: string;
    status: 'ACTIVE' | 'RESOLVED' | 'STALE';
};

const STORAGE_KEY = 'cbjjs_diagnostic_logs';

class DataBridgeIntegrityProbe {
    private logs: DiagnosticLog[] = [];
    private listeners: ((logs: DiagnosticLog[]) => void)[] = [];

    constructor() {
        if (typeof window !== 'undefined') {
            this.loadLogs();

            // Captura erros fatais
            window.onerror = (message, source, lineno, colno, error) => {
                this.addLog('CRITICAL', `ERRO: ${message}`, { 
                    source, 
                    stack: error?.stack 
                });
            };
            
            window.onunhandledrejection = (event) => {
                this.addLog('ERROR', `Falha Async: ${event.reason?.message || event.reason}`);
            };
        }
    }

    private loadLogs() {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                // Ao carregar, marcamos erros antigos como 'STALE' (Instáveis/Antigos)
                // Eles só reaparecerão se o erro ocorrer novamente na sessão atual
                const parsed = JSON.parse(saved);
                this.logs = parsed.map((l: DiagnosticLog) => ({
                    ...l,
                    status: l.status === 'RESOLVED' ? 'RESOLVED' : 'STALE'
                }));
            }
        } catch (e) {
            this.logs = [];
        }
    }

    private saveToStorage() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(this.logs));
        } catch (e) {}
    }

    addLog(level: DiagnosticLog['level'], message: string, payload?: any) {
        // Deduplicação: se a mensagem for igual, atualizamos o log existente ao invés de criar novo
        const existingIndex = this.logs.findIndex(l => l.message === message);
        
        const log: DiagnosticLog = {
            id: existingIndex >= 0 ? this.logs[existingIndex].id : Math.random().toString(36).substr(2, 9),
            timestamp: new Date().toLocaleString('pt-BR'),
            level,
            message,
            payload,
            diagnosis: this.diagnose(level, message, payload),
            status: 'ACTIVE'
        };

        if (existingIndex >= 0) {
            this.logs[existingIndex] = log;
        } else {
            this.logs = [log, ...this.logs].slice(0, 20); // Limite de 20 logs recentes
        }

        this.saveToStorage();
        this.notify();
    }

    // Marca erros de renderização como resolvidos (chamado quando a UI carrega com sucesso)
    resolveRenderErrors() {
        let changed = false;
        this.logs = this.logs.map(l => {
            if (l.level === 'CRITICAL' && l.status !== 'RESOLVED') {
                changed = true;
                return { ...l, status: 'RESOLVED' };
            }
            return l;
        });
        if (changed) {
            this.saveToStorage();
            this.notify();
        }
    }

    private diagnose(level: string, message: string, payload: any): string | undefined {
        if (level === 'ERROR' || level === 'CRITICAL') {
            const msg = (message + JSON.stringify(payload)).toLowerCase();
            if (msg.includes('trash2 is not defined')) return 'Erro de Referência: Ícone Trash2 não foi importado.';
            if (msg.includes('uuid') || payload?.code === '22p02') return 'ID Inválido enviado ao Banco.';
            if (msg.includes('permission denied')) return 'Bloqueio de Segurança (RLS).';
            return 'Falha detectada na execução.';
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
        try {
            const { data } = await supabase.from(entityTable).select('id').eq('id', id).maybeSingle();
            return { id_exists: !!data };
        } catch (err) { return null; }
    }

    clear() {
        this.logs = [];
        localStorage.removeItem(STORAGE_KEY);
        this.notify();
    }
}

export const probe = new DataBridgeIntegrityProbe();