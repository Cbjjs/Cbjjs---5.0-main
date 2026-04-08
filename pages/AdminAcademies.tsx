import React, { useRef, useEffect } from 'react';
import { Search, RefreshCw, Building, Clock, X, AlertTriangle, Loader2, Trash2 } from 'lucide-react';
import { AdminListSkeleton, PaginationControls, AdminErrorState } from '../components/AdminShared';
import { AdminAcademyDetailsModal } from '../components/AdminAcademyDetailsModal';
import { AcademyListItem } from '../components/admin/AcademyListItem';
import { useAdminAcademies } from '../hooks/useAdminAcademies';
import { DiagnosticIntegrityBanner } from '../components/DiagnosticIntegrityBanner';
import { probe } from '../utils/diagnosticProbe';

export const AdminAcademies: React.FC = () => {
  const {
    academies, totalCount, totalPages, isLoading, isError, subTab, searchTerm, page,
    viewingAcademy, processingId, academyToDelete, isDeleting,
    rejectingDoc, rejectionReason,
    setSubTab, setSearchTerm, setPage, setViewingAcademy,
    setRejectingDoc, setRejectionReason,
    refetch, handleApproveAcademy, handleApproveUpdate, handleConfirmDelete,
    handleApproveDoc, handleRejectDoc, confirmRejectDoc
  } = useAdminAcademies();

  const [activeMenuId, setActiveMenuId] = React.useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Executa a exclusão direta com diagnóstico integrado
  const handleDirectDelete = async (academy: any) => {
      if (confirm(`Deseja realmente excluir permanentemente a unidade "${academy.name}"?`)) {
          probe.addLog('INFO', `Iniciando exclusão direta: ${academy.name}`);
          await probe.deepScan('academies', academy.id);
          handleConfirmDelete(academy);
      }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActiveMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
      <div className="space-y-6 animate-fadeIn">
          {/* BANNER DE INTEGRIDADE */}
          <div className="fixed top-0 left-0 right-0 z-[100] md:relative md:z-10 md:rounded-t-2xl overflow-hidden">
             <DiagnosticIntegrityBanner uiCount={academies.length} />
          </div>

          <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Gestão de Academias</h2>
          
          <div className="flex gap-6 mb-8 border-b border-gray-200 dark:border-gray-800">
              <button 
                onClick={() => setSubTab('approvals')} 
                className={`pb-4 px-2 text-sm font-black uppercase tracking-widest border-b-2 transition-all flex items-center ${subTab === 'approvals' ? 'border-cbjjs-blue text-cbjjs-blue' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
              >
                  <Clock size={16} className="mr-2"/> Novas / Atualizações
              </button>
              <button 
                onClick={() => setSubTab('all')} 
                className={`pb-4 px-2 text-sm font-black uppercase tracking-widest border-b-2 transition-all flex items-center ${subTab === 'all' ? 'border-cbjjs-blue text-cbjjs-blue' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
              >
                  <Building size={16} className="mr-2"/> Academias Aprovadas
              </button>
          </div>
          
          <div className="flex flex-col md:flex-row justify-between items-center bg-white dark:bg-slate-800 p-5 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm mb-6 gap-4">
              <div className="relative w-full max-w-lg">
                  <Search className="absolute left-4 top-3 text-gray-400" size={20} />
                  <input 
                    type="text" 
                    placeholder="Nome da academia..." 
                    className="w-full pl-12 pr-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-slate-700 focus:ring-2 focus:ring-cbjjs-blue outline-none transition-all" 
                    value={searchTerm} 
                    onChange={(e) => setSearchTerm(e.target.value)} 
                  />
              </div>
              <div className="flex items-center gap-4">
                  <span className="text-xs font-black uppercase tracking-widest text-gray-400">Total: {totalCount}</span>
                  <button onClick={() => refetch()} className="text-cbjjs-blue p-2.5 rounded-xl transition-colors hover:bg-gray-100 dark:hover:bg-slate-700">
                    <RefreshCw size={20} className={isLoading ? 'animate-spin' : ''} />
                  </button>
              </div>
          </div>

          {isLoading ? (
              <AdminListSkeleton />
          ) : isError ? (
              <AdminErrorState onRetry={() => refetch()} />
          ) : (
              <div className="grid grid-cols-1 gap-4">
                  {academies.length === 0 ? (
                      <div className="text-center py-20 bg-white dark:bg-slate-800 rounded-3xl border border-gray-100 dark:border-gray-700">
                          <Building size={48} className="text-gray-200 mx-auto mb-4" />
                          <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Nenhuma academia encontrada.</p>
                      </div>
                  ) : (
                      academies.map(academy => (
                          <AcademyListItem 
                            key={academy.id}
                            academy={academy}
                            onClick={setViewingAcademy}
                            onDelete={(acc) => handleDirectDelete(acc)}
                            isActiveMenu={activeMenuId === academy.id}
                            onMenuToggle={setActiveMenuId}
                            menuRef={menuRef}
                          />
                      ))
                  )}
              </div>
          )}
          
          {!isError && !isLoading && totalPages > 1 && (
              <PaginationControls 
                page={page} 
                totalPages={totalPages} 
                onPrev={() => setPage(Math.max(1, page - 1))} 
                onNext={() => setPage(page + 1)} 
              />
          )}

          <AdminAcademyDetailsModal 
            isOpen={!!viewingAcademy} 
            onClose={() => setViewingAcademy(null)} 
            academy={viewingAcademy}
            onApproveAcademy={handleApproveAcademy} 
            onApproveUpdate={handleApproveUpdate}
            onApproveDoc={handleApproveDoc}
            onRejectDoc={handleRejectDoc}
            onDeleteAcademy={(acc) => {
                setViewingAcademy(null);
                handleDirectDelete(acc);
            }}
            processingId={processingId}
          />

          {rejectingDoc && (
              <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
                  <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl relative border dark:border-slate-700">
                      <button onClick={() => setRejectingDoc(null)} className="absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-900">
                        <X size={24}/>
                      </button>
                      <h3 className="text-xl font-black mb-6 dark:text-white uppercase tracking-tight">Motivo da Recusa (Academia)</h3>
                      <textarea 
                        className="w-full p-4 bg-gray-50 dark:bg-slate-900 border border-slate-700 rounded-2xl mb-6 outline-none focus:ring-2 focus:ring-red-500 dark:text-white shadow-inner" 
                        rows={4} 
                        value={rejectionReason} 
                        onChange={e => setRejectionReason(e.target.value)} 
                        placeholder="Ex: Certificado ilegível ou data de validade expirada..."
                      />
                      <div className="flex gap-3">
                          <button onClick={() => setRejectingDoc(null)} className="flex-1 py-4 bg-gray-100 dark:bg-slate-700 text-gray-600 rounded-2xl font-black uppercase text-[10px]">Cancelar</button>
                          <button 
                            onClick={confirmRejectDoc} 
                            disabled={!rejectionReason.trim() || processingId === 'rejecting'} 
                            className="flex-1 py-4 bg-red-600 text-white rounded-2xl font-black uppercase text-[10px] shadow-lg flex items-center justify-center gap-2"
                          >
                            {processingId === 'rejecting' && <Loader2 className="animate-spin" size={14}/>}
                            Confirmar Recusa
                          </button>
                      </div>
                  </div>
              </div>
          )}
      </div>
  );
};