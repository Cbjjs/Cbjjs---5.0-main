"use client";

import { useIntegrity } from '../context/IntegrityContext';
import { integrityService } from '../services/integrityService';

export function useIntegrityProbe() {
    const { traceAction, updateTrace } = useIntegrity();

    const runDeleteProbe = async (userId: string, deleteFn: () => Promise<any>) => {
        const traceId = traceAction('USER_DELETE_PROCESS', { userId });
        
        try {
            // 1. Varredura Pré-Exclusão
            const preReport = await integrityService.probeUserIntegrity(userId);
            
            if (!preReport.isValid) {
                console.warn("[PROBE] Falha de integridade detectada antes de excluir:", preReport.reason);
            }

            // 2. Executa a ação real
            const response = await deleteFn();

            // 3. Varredura Pós-Exclusão (Deve retornar NOT_FOUND)
            const postReport = await integrityService.probeUserIntegrity(userId);

            updateTrace(traceId, response, 'success', postReport);
            return response;

        } catch (err: any) {
            // Varredura de Diagnóstico de Erro
            const errorReport = await integrityService.probeUserIntegrity(userId);
            updateTrace(traceId, err, 'error', errorReport);
            throw err;
        }
    };

    return { runDeleteProbe };
}