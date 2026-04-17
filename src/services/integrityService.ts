"use client";

import { supabase } from '../lib/supabase';

export type IntegrityReport = {
    isValid: boolean;
    reason?: 'TYPE_MISMATCH' | 'RLS_BLOCKED' | 'SCHEMA_SYNC_ISSUE' | 'NOT_FOUND';
    details: any;
    timestamp: number;
};

export const integrityService = {
    /**
     * Realiza simultaneamente 3 estratégias de busca para cruzar dados de um usuário
     * detectando falhas silenciosas de RLS ou Tipagem.
     */
    async probeUserIntegrity(userId: string): Promise<IntegrityReport> {
        const timestamp = Date.now();
        
        try {
            // 1. Busca Direta (Tipagem Padrão)
            const p1 = supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
            
            // 2. Busca por Relacionamento (Nested Join - Testa FKs e RLS de tabelas vinculadas)
            const p2 = supabase.from('profiles').select('*, academies(*)').eq('id', userId).maybeSingle();
            
            // 3. Busca por Filtro Bruto (String/Filter - Detecta falhas de Casting UUID)
            const p3 = supabase.from('profiles').select('id').filter('id', 'eq', userId.toString());

            const [res1, res2, res3] = await Promise.all([p1, p2, p3]);

            const dbExists = !!res1.data;
            const uiVisible = !!res3.data && (res3.data as any[]).length > 0;
            const joinValid = !!res2.data;

            // DIAGNÓSTICO
            if (dbExists && !uiVisible) {
                return { 
                    isValid: false, 
                    reason: 'RLS_BLOCKED', 
                    details: { res1, res2, res3 },
                    timestamp 
                };
            }

            if (dbExists && !joinValid) {
                return { 
                    isValid: false, 
                    reason: 'SCHEMA_SYNC_ISSUE', 
                    details: { msg: "Falha ao carregar relacionamentos (FK Quebrada?)", res2 },
                    timestamp 
                };
            }

            if (!dbExists && uiVisible) {
                return { 
                    isValid: false, 
                    reason: 'TYPE_MISMATCH', 
                    details: { msg: "Divergência de Casting entre Cache e DB", res3 },
                    timestamp 
                };
            }

            return { 
                isValid: dbExists, 
                reason: dbExists ? undefined : 'NOT_FOUND',
                details: { dbExists, uiVisible, joinValid },
                timestamp 
            };

        } catch (err: any) {
            return { 
                isValid: false, 
                reason: 'SCHEMA_SYNC_ISSUE', 
                details: err,
                timestamp 
            };
        }
    }
};