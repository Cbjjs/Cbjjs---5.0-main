import React, { useRef, useEffect } from 'react';
import { Search, RefreshCw, Building, Clock, Trash2, Trash } from 'lucide-react';
import { AdminListSkeleton, PaginationControls, AdminErrorState } from '../components/AdminShared';
import { AdminAcademyDetailsModal } from '../components/AdminAcademyDetailsModal';
import { AcademyListItem } from '../components/admin/AcademyListItem';
import { useAdminAcademies } from '../hooks/useAdminAcademies';

export const AdminAcademies: React.FC = () => {
  const {
    academies, totalCount, totalPages, isLoading, isError, subTab, searchTerm, page,
    viewingAcademy, processingId, isDeleting,
    setSubTab, setSearchTerm, setPage, setViewingAcademy,
    refetch, handleApproveAcademy, handleConfirmDelete, handleRestore,
    handleApproveDoc, handleRejectDoc
  } = useAdminAcademies();

  const [activeMenuId, setActiveMenuId] = React.useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

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
          <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Gestão de Academias</h2>
          
          <div className="flex flex-wrap gap-4 border-b border-gray-200 dark:border-gray-800">
              <button 
                onClick={() => setSubTab('approvals')} 
                className={`pb-4 px-2 text-xs font-black uppercase tracking-widest border-b-2 transition-all flex items-center ${subTab === 'approvals' ? 'border-cbjjs-blue text-cbjjs-blue' : 'border-transparent text-gray-400'}`}
              >
                  <Clock size={16} className="mr-2"/> Novas
              </button>
              <button 
                onClick={() => setSubTab('all')} 
                className={`pb-4 px-2 text-xs font-black uppercase tracking-widest border-b-2 transition-all flex items-center ${subTab === 'all' ? 'border-cbjjs-blue text-cbjjs-blue' : 'border-transparent text-gray-400'}`}
              >
                  <Building size={16} className="mr-2"/> Ativas
              </button>
              <button 
                onClick={() => setSubTab('trash')} 
                className={`pb-4 px-2 text-xs font-black uppercase tracking-widest border-b-2 transition-all flex items-center ${subTab === 'trash' ? 'border-red-500 text-red-600' : 'border-transparent text-gray-400'}`}
              >
                  <Trash size={16} className="mr-2"/> Lixeira
              </button>
          </div>
          
          <div className="flex flex-col md:flex-row justify-between items-center bg-white dark:bg-slate-800 p-5 rounded-2xl border border-gray-200 shadow-sm gap-4">
              <div className="relative w-full max-w-lg">
                  <Search className="absolute left-4 top-3.5 text-gray-400" size={20} />
                  <input 
                    type="text" 
                    placeholder="Nome da academia..." 
                    className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl bg-gray-50 dark:bg-slate-700 focus:ring-2 focus:ring-cbjjs-blue outline-none" 
                    value={searchTerm} 
                    onChange={(e) => setSearchTerm(e.target.value)} 
                  />
              </div>
              <button onClick={() => refetch()} className="text-cbjjs-blue p-2.5 rounded-xl hover:bg-gray-100">
                <RefreshCw size={20} className={isLoading ? 'animate-spin' : ''} />
              </button>
          </div>

          {isLoading || isDeleting ? (
              <AdminListSkeleton />
          ) : isError ? (
              <AdminErrorState onRetry={() => refetch()} />
          ) : (
              <div className="grid grid-cols-1 gap-4">
                  {academies.length === 0 ? (
                      <div className="text-center py-20 bg-white dark:bg-slate-800 rounded-3xl border border-gray-100">
                          <Trash size={48} className="text-gray-200 mx-auto mb-4" />
                          <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Nenhuma academia aqui.</p>
                      </div>
                  ) : (
                      academies.map(academy => (
                          <AcademyListItem 
                            key={academy.id}
                            academy={academy}
                            onClick={setViewingAcademy}
                            onDelete={(acc) => { if(confirm(`Mover ${acc.name} para lixeira?`)) handleConfirmDelete(acc.id); }}
                            onRestore={(id) => handleRestore(id)}
                            isActiveMenu={activeMenuId === academy.id}
                            onMenuToggle={setActiveMenuId}
                            menuRef={menuRef}
                          />
                      ))
                  )}
              </div>
          )}
          
          {totalPages > 1 && (
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
            onApproveDoc={handleApproveDoc}
            onRejectDoc={handleRejectDoc}
            onDeleteAcademy={(acc) => { setViewingAcademy(null); handleConfirmDelete(acc.id); }}
            onRestore={handleRestore}
            processingId={processingId}
            onApproveUpdate={async () => {}} // Stub
          />
      </div>
  );
};