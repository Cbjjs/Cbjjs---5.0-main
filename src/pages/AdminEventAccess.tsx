import React, { useState } from 'react';
import { Search, RefreshCw, Scan, UserCheck } from 'lucide-react';
import { AdminListSkeleton, AdminErrorState } from '../components/AdminShared';

export const AdminEventAccess: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  // Estados iniciais para simular a estrutura
  const isLoading = false;
  const isError = false;

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2">
        <div>
          <h2 className="text-3xl font-black dark:text-white tracking-tight">Acesso Evento</h2>
          <p className="text-sm text-gray-500 font-medium">Busca rápida de atletas para validação de entrada.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => {}} 
            className="p-3 bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-xl text-cbjjs-blue hover:bg-gray-50 transition-all shadow-sm"
          >
            <RefreshCw size={20} />
          </button>
        </div>
      </div>

      {/* Barra de Busca - Exatamente como solicitado (igual gestão de professores) */}
      <div className="relative w-full">
        <Search className="absolute left-4 top-3.5 text-gray-400" size={20} />
        <input 
          type="text" 
          placeholder="Digite o nome ou número de inscrição (ID)..." 
          className="w-full pl-12 pr-4 py-4 border border-gray-200 dark:border-gray-700 rounded-2xl bg-white dark:bg-slate-800 focus:ring-2 focus:ring-cbjjs-blue outline-none transition-all shadow-sm text-sm" 
          value={searchTerm} 
          onChange={(e) => setSearchTerm(e.target.value)} 
        />
      </div>

      {isLoading ? (
        <AdminListSkeleton />
      ) : isError ? (
        <AdminErrorState onRetry={() => {}} />
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {/* A lista será implementada na próxima etapa */}
          <div className="text-center py-24 bg-white dark:bg-slate-800 rounded-[2.5rem] border border-dashed border-gray-200 dark:border-slate-700">
            <Scan size={48} className="text-gray-200 mx-auto mb-4" />
            <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">
              Aguardando termo de busca...
            </p>
          </div>
        </div>
      )}
    </div>
  );
};