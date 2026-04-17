"use client";

import React, { createContext, useContext, useState, useCallback } from 'react';
import { IntegrityReport } from '../services/integrityService';

export type ExecutionLog = {
    id: string;
    action: string;
    payload: any;
    response?: any;
    status: 'success' | 'error' | 'pending';
    report?: IntegrityReport;
    timestamp: number;
};

interface IntegrityContextType {
    logs: ExecutionLog[];
    lastReport: IntegrityReport | null;
    isProbeActive: boolean;
    traceAction: (action: string, payload: any) => string;
    updateTrace: (id: string, response: any, status: 'success' | 'error', report?: IntegrityReport) => void;
    clearLogs: () => void;
}

const IntegrityContext = createContext<IntegrityContextType | undefined>(undefined);

export const IntegrityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [logs, setLogs] = useState<ExecutionLog[]>([]);
    const [lastReport, setLastReport] = useState<IntegrityReport | null>(null);
    const [isProbeActive, setIsProbeActive] = useState(false);

    const traceAction = useCallback((action: string, payload: any) => {
        const id = Math.random().toString(36).substring(7);
        const newLog: ExecutionLog = {
            id,
            action,
            payload,
            status: 'pending',
            timestamp: Date.now()
        };
        setLogs(prev => [newLog, ...prev].slice(0, 50));
        setIsProbeActive(true);
        return id;
    }, []);

    const updateTrace = useCallback((id: string, response: any, status: 'success' | 'error', report?: IntegrityReport) => {
        setLogs(prev => prev.map(log => 
            log.id === id ? { ...log, response, status, report } : log
        ));
        if (report) setLastReport(report);
        setIsProbeActive(false);
    }, []);

    const clearLogs = () => {
        setLogs([]);
        setLastReport(null);
    };

    return (
        <IntegrityContext.Provider value={{ logs, lastReport, isProbeActive, traceAction, updateTrace, clearLogs }}>
            {children}
        </IntegrityContext.Provider>
    );
};

export const useIntegrity = () => {
    const context = useContext(IntegrityContext);
    if (!context) throw new Error('useIntegrity must be used within IntegrityProvider');
    return context;
};